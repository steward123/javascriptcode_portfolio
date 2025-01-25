import express from 'express';
import { db, connectToDb } from './models/db.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

import cors from 'cors';

// CORS options to allow requests from frontend running on port 2587
const corsOptions = {
    origin: 'https://steward123.github.io', // Allow only requests from this origin
    methods: 'GET,POST,PUT,DELETE', // Allow only these methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow only these headers
};

const app = express();
// Use CORS middleware with specified options
app.use(cors(corsOptions));
app.use(express.json());

// save new user to the contact table of the portfolio database

async function savecontacts(res,req)
{
    const { Name, Email, message } = req.body;

    var query = {'Email': Email};

    var query_result = await db.collection('contact').findOne(query);

    if(query_result !== null)
    {
        res.json('Data already exists in our database !');
    }
    const result = await db.collection('contact').insertOne({ Name, Email, message });
    return req.body;
}

function generateUUID() {
    return crypto.randomBytes(20).toString('hex');
}

app.post('/api/resume', async (req, res) => {
    const guid_generate = generateUUID();
    const lastModified = new Date().toISOString();

    var result = await db.collection('resume').find({ 'contact.Email': req.body.Email }).toArray();

    //let contact;

    if(result.length === 0)
    {
        const contact = await savecontacts(res, req);
        const result = await db.collection('resume').insertOne({ lastModified, guid_generate, contact });
        res.json({ lastModified, guid_generate, contact });
    }

    //const contact = await savecontacts(res,req);

    const email = req.body.Email;

    if(result.length > 0)
    {

        for(let i = 0;i<result.length;i++)
        {
            const lastModifiedDBdate = new Date(result[i].lastModified);
            const currentDate = new Date();

            const diffTime = Math.abs(currentDate - lastModifiedDBdate);
            const diffDates = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            console.log(diffDates);

            if(diffDates > 30)
            {
                const result = await db.collection('resume').updateOne({ 'contact.Email': email }, { $set: { lastModified, guid_generate } });
                res.json({ lastModified, guid_generate});
            }

            if (diffDates < 30 || diffDates == 0)
            {
                res.json('Data already exists in our database !');
            }
        }
    }
});

/*This downloadable option has already been handled in the react components*/

/*app.get('/api/downloadsResume', async (req, res) => {
    const filePath = path.join('public', 'Resume_Soumit_Mondal.pdf');
    const fileContent = fs.readFileSync(filePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Resume_Soumit_Mondal.pdf');
    res.send(fileContent);
});*/









const port = process.env.PORT || 5387;
connectToDb(() => {
    console.log('Successfully connected to database!');
    app.listen(port, () => {
        console.log('Server is listening on port 5387');
    });
})