const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt-nodejs');

const db = knex({
    client: 'pg',
    connection: {
      connectionString : process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  });

// const db = knex({
//     client: 'pg',
//     connection: {
//       connectionString : 'dpg-cgpjen0u9tun42tih5hg-a.oregon-postgres.render.com',
//       ssl: { rejectUnauthorized: false},
//       host: 'dpg-cgpjen0u9tun42tih5hg-a',
//       port: 5432,
//       user: 'mydb_sin1_user',
//       password: 'YCzYI5AApNQd3ENAiPaKsO26AcEDCBZE',
//       database: 'mydb_sin1'
//     }
//   });


const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('success20');
    res.send(`${process.env.PORT}`);
})

app.post('/signin', (req, res) => {
    const {email, password} = req.body;
    if(!email || !password) {
        return res.status(400).json('incorrect form submission');
    }
    db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
        const isValid = bcrypt.compareSync(password, data[0].hash);
        if(isValid) {
            return db.select('*').from('users')
            .where('email', '=', email)
            .then(user => {
                res.json(user[0]);
            })
            .catch(err => res.status(400).json('unable to get user'));
        } else {
            res.status(400).json('wrong credentials')
        }
    })
    .catch(err => res.status(400).json('wrong credentials'));
})

app.post('/register', (req, res) => {
    const {email, name, password} = req.body;
    if(!email || !name || !password) {
        return res.status(400).json('incorrect form submission');
    }

    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
            .returning('*')
            .insert({
                email: loginEmail[0].email,
                name: name,
                joined: new Date()
            })
                .then(user => {
                    res.json(user[0]);
                })
            })
            .then(trx.commit)
            .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register2'))
    
})

app.get('/profile/:id', (req, res) => {
    const {id} = req.params;
    let found = false;
    db.select('*').from('users').where({id}).then(user=> {
        if(user.length) {
            res.json(user[0])
        } else {
            res.status(400).json('Not found')
        }
       
    })
        .catch(err => res.status(400).json('error getting user'))


})

app.put('/image', (req, res) => {
    let {id} = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0].entries);
    })
    .catch(err => res.status(400).json('unable to get entries'))
})


app.listen(process.env.PORT, () => {
    // console.log(`app is running on port 3000`);
    console.log(`app is running on port ${process.env.PORT}`);
    
})


