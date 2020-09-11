//importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: '1070286',
    key: '75dbfa7b340a61ed6ab8',
    secret: '97c9c290a6f46dcbb65f',
    cluster: 'eu',
    encrypted: true
  });

//middlewares
app.use(express.json());

app.use(cors())

/*app.use((req, res, next)=>{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","*");
    next();
})*/


//DBConfig
const connection_url='mongodb+srv://admin:JR0sgGQTQiAMaVQa@cluster0.plvy3.mongodb.net/whatsappdb?retryWrites=true&w=majority';
mongoose.connect(connection_url, {
    useCreateIndex:true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db=mongoose.connection

db.once('open',()=>{
    console.log("db Connected");

    const msgCollection=db.collection('messagecontents')
    const changeStream=msgCollection.watch();

    changeStream.on('change',(change)=>{
        console.log(change);
        if(change.operationType==='insert'){
            const messageDetails=change.fullDocument;
            pusher.trigger('messages','inserted',{
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp:messageDetails.timestamp,
                received: messageDetails.received
            });
        }else{
            console.log('Error triggering pusher');
        }



    });
})

//api routes
app.get('/',(req,res)=>res.status(200).send('Hello'));

app.get('/messages/sync',(req,res)=>{
    Messages.find((err,data)=>{
        if(err){
            res.status(500).send(err);
        }else{
            res.status(200).send(data);
        }
    })
})

app.post('/messages/new', (req, res)=>{
    const dbMessage = req.body
    Messages.create(dbMessage,(err,data)=>{
        if(err){
            res.status(500).send(err);
        }else{
            res.status(201).send(`new message created: \n ${data}`);
        }
    })
})

//Listen
app.listen(port,()=>console.log(`Listening on localhost:${port}`));