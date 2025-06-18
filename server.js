const express=require('express');
const bcrypt=require('bcrypt');
const bodyParser=require('body-parser');
const {MongoClient}=require('mongodb');
const session=require('express-session');
const http=require('http');
const {Server}=require('socket.io');
const path=require('path');
const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*",methods:["GET","POST"]}});
const PORT=3000;
const dbdetails={mongoUri:'mongodb+srv://aks:aks@cluster0.bptf95x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',dbName:'Stock',collectionName:'users',};
app.use(session({secret:'escrowstack',resave:false,saveUninitialized:true}));
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
app.use(express.static('.'));
let db;
io.on('connection',(socket) => {});
MongoClient.connect(dbdetails.mongoUri).then(client=>{
    db=client.db(dbdetails.dbName);
    server.listen(PORT,()=>{
      console.log(`Server running at http://localhost:${PORT}`);
    });
    })
  .catch(err=>{
    console.error('MongoDB connection failed:',err);
  });

app.get('/', (req, res) => {
  res.redirect('/login.html');
});
app.get('/dashboard.html',(req, res) => {
  if (!req.session.username) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(__dirname,'dashboard.html'));});
app.post('/login',async(req,res)=>{
  const {email,password}=req.body;
  try {
    const users=db.collection(dbdetails.collectionName);
    const user=await users.findOne({email});
    if (!user) {
      return res.status(400).send('Invalid Email or password');}
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).send('Invalid Email or password');}
    req.session.username=user.username;
    req.session.userId=user._id;
    res.redirect('/dashboard.html');
  } catch (err) {
    console.error('Login Error:',err);
    res.status(500).send('Internal Server Error');
  }
});
app.post('/logout',(req,res)=>{
  req.session.destroy((err)=>{
    if (err) {
      return res.status(500).json({error:'Error in Log out'});
    }
    res.json({message:'Logged out successfully'});
  });
});
app.get('/api/user', (req, res) => {
  if (req.session.username) {
    res.json({ 
      username: req.session.username,
      userId: req.session.userId 
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

function isValidPAN(pan){
  const panRegex=/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
}
function isStrongPassword(password) {
  const strongRegex=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  return strongRegex.test(password);
}
app.post('/signup',async (req,res)=>{
  const {username,email,pancard,password}=req.body;
   try {
    if (!isValidPAN(pancard)) {
      return res.status(400).send('Invalid PAN card format. It must be like "ABCDE1234F".');}
    if (!isStrongPassword(password)) {
      return res.status(400).send('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');}
    const dbusers= db.collection(dbdetails.collectionName);
    const dbemail=await dbusers.findOne({email});
    if (dbemail) {
      return res.status(400).send('Email already registered.');}
    const usernameexist = await dbusers.findOne({username});
    if (usernameexist) {
      return res.status(400).send('Username already taken.');}
    const hashedpassword=await bcrypt.hash(password,10);
    const hashedpancard=await bcrypt.hash(pancard,10);
    const newUser = {username,email,pancard: hashedpancard,password: hashedpassword,subscriptions: [],createdAt: new Date()};
    await dbusers.insertOne(newUser);
    res.redirect('/login.html');
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).send('Internal Server Error');
  }});
app.get('/api/subscriptions',async(req,res)=>{
  if (!req.session.username) {    
    return res.status(401).json({error:'Unauthorized' });}
  try{
    const dbusers = db.collection(dbdetails.collectionName);
    const currentuserindb = await dbusers.findOne({ username: req.session.username });
    if (!currentuserindb) {
      return res.status(404).json({ error: 'User not found' });}
    const subscriptions=currentuserindb.subscriptions || [];
    res.json({ subscriptions });
  }catch(err){
    console.error('Subscription fetch error:', err);
    res.status(500).json({ error: 'Server error' });}});
app.post('/api/subscribe', async (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ error: 'Unauthorized' });}
  const {instrument,quantity,price}=req.body;
  if (!instrument || !quantity || !price) {
    return res.status(400).json({ error: 'Missing required fields: instrument, quantity, price' });}
  if (typeof quantity!=='number' || quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive number' });}
  if (typeof price!=='number'||price<=0){
    return res.status(400).json({ error:'Price must be a positive number' });}
  try {
    const users = db.collection(dbdetails.collectionName);
    const currentuserindbuser = await users.findOne({ username: req.session.username });
    if (!currentuserindbuser) {
      return res.status(404).json({ error: 'User not found' });}
    const currentusersubscription=currentuserindbuser.subscriptions || [];
    const alreadysubscribedto=currentusersubscription.some(sub=>sub.instrument===instrument);
    if (alreadysubscribedto) {
      return res.status(400).json({ error: 'Already subscribed to this instrument' });}
    const newsubscription = {instrument,quantity:Number(quantity),price:Number(price),subscribedAt:new Date()};
    const updateResult = await users.updateOne({username:req.session.username},{$push:{subscriptions:newsubscription}});
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: 'Error updating data or no username in db' });}
    res.json({message:'IPO subscription submitted successfully',
      subscription:newsubscription});
  }catch(err){
    console.error('Error:',err);
    res.status(500).json({ error: 'Server error'});}});