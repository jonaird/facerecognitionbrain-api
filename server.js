const express = require('express');
const bodyParser=require('body-parser');
const bcrypt=require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex')({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'jonathanaird',
    password : '',
    database : 'smart-brain'
  }
});

const app = express();


const database = {
	users:[{
		id:123,
		name:"Jon",
		password:"123",
		email:'jon@gmail.com',
		entries: 0,
		joined: new Date()
		},
		{
		id:124,
		name:"Sally",
		email:"sally@gmail.com", 
		password:"345",
		entries: 0,
		joined: new Date()
		}
	]
}
app.use(bodyParser.json());
app.use(cors());
app.get('/', (req,res)=>res.send(database.users));


app.post('/signin', (req,res)=>{
	const {email, password} = req.body;
	const signInSuccess=(email)=>{
		knex('users').select().where({email:email}).returning()
		.then(user=>res.json(user[0]))
		.catch(err=>res.status(400).json('error geting user'));
	}

	knex('login').select('email','hash').where({email:email})
	.then(user=>bcrypt.compareSync(password,user[0].hash)?signInSuccess(user[0].email):res.json('user not found'))
	.catch(err=>res.status(400).json('user not found'));
	
}) 

app.post('/register', (req,res)=>{
	const {email, name, password}=req.body;
	const hash = bcrypt.hashSync(password);
	const transaction = (trx)=>{
		 trx.insert({
		hash: hash,
		email: email,
		})
		.into('login')
		.returning('email')
		.then(loginEmail=>{
			return trx('users').returning('*')
			.insert({email:loginEmail[0],name:name, joined: new Date()})
			.then(user=>res.json(user[0]))
			.catch(err=>res.status(400).json("unable to register"));
		})
		.then(trx.commit)
		.catch(trx.rollback);
	}
	knex.transaction(transaction).catch(err=>res.status(400).json('cannot register user'));
	
})

app.get('/profile/:id',(req,res)=>{
	const {id} = req.params;
	knex.select().from('users').where({id:id})
	.then(user=>user.length?res.json(user[0]):res.status(404).json('user not found'))
	.catch(err=>res.status(400).json('error getting user'));
})

app.put('/images',(req,res)=>{
	const {id} = req.body;
	knex('users').returning('*').where({id:id})
	.increment('entries',1)
	.then(user=>res.json(user[0]))
	.catch(err=>res.status(400).json('error logging entry'));
})

app.listen(3001);


 /*
 / -> res this is working
 /signin -> POST = success/fail

 */
