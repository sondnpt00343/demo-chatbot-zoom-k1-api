const Pusher = require("pusher");

const pusher = new Pusher({
    appId: process.env.VITE_SOKETI_ID,
    key: process.env.VITE_SOKETI_KEY,
    secret: process.env.VITE_SOKETI_SECRET,
    host: process.env.VITE_SOKETI_HOST,
    port: process.env.VITE_SOKETI_PORT,
    cluster: "",
    useTLS: true
});

module.exports = pusher