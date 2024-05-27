const express = require('express');
const axios = require('axios');
const { Client } = require('discord.js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000; // Use provided port or default to 3000

const client = new Client({ intents: ["GUILDS", "GUILD_MEMBERS"] });

client.login(process.env.BOT_TOKEN);

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    const redirect_uri = encodeURIComponent(process.env.REDIRECT_URI);
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${redirect_uri}&response_type=code&scope=identify%20guilds.join`);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    const redirect_uri = process.env.REDIRECT_URI;

    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirect_uri
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token } = tokenResponse.data;

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const user = userResponse.data;

        client.guilds.fetch(process.env.GUILD_ID).then(guild => {
            guild.members.add(user.id, { accessToken: access_token });
        });

        res.send(`Hello, ${user.username}. You have been added to the server!`);
    } catch (error) {
        console.error(error);
        res.send('An error occurred');
    }
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
