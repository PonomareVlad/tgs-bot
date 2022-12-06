import {lookup} from "mime-types";
import FormData from 'form-data';
import TeleBot from "telebot";
import https from "https";

const url = 'https://tgs-vercel.vercel.app/api/'
const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN)

bot.on('text', msg => msg.reply.text(`Send me SVG file`))
bot.on('document', async msg => {
    let {document: {mime_type, file_name, file_id}} = msg;
    if (!mime_type && file_name) mime_type = lookup(file_name);
    const {fileLink} = await bot.getFile(file_id);
    const form = new FormData();
    return new Promise((resolve) => https.request(fileLink, response => {
        form.append('file', response);
        form.submit(url, function (err, res) {
            const chunks = [];
            res.on('data', chunks.push.bind(chunks));
            res.on("end", () => resolve(msg.reply.file(Buffer.concat(chunks), {fileName: 'sticker.tgs'})));
        });
    }).end());
})

export default bot
