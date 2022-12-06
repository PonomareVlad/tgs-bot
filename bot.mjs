import {basename, extname} from "path";
import {lookup} from "mime-types";
import FormData from 'form-data';
import TeleBot from "telebot";
import https from "https";

const {API_URL, TELEGRAM_BOT_TOKEN} = process.env;
const bot = new TeleBot(TELEGRAM_BOT_TOKEN);
const getFileName = (name = 'sticker.tgs') => basename(name, extname(name)) + '.tgs';
const types = ['text', 'sticker', 'photo', 'audio', 'voice', 'video', 'videoNote', 'animation', 'contact', 'location', 'venue', 'game', 'passportData'];

bot.on(types, msg => msg.reply.text(`Send me the SVG file`))
bot.on('document', async msg => {
    let {document: {mime_type, file_name, file_id}} = msg;
    if (!mime_type && file_name) mime_type = lookup(file_name);
    if (mime_type !== 'image/svg+xml')
        return msg.reply.text(`Only SVG files are supported, your file has an unsupported MIME: ${mime_type}`, {asReply: true});
    msg.reply.action('upload_document');
    const {fileLink} = await bot.getFile(file_id);
    const sticker = await convert(fileLink);
    const fileName = getFileName(file_name);
    const {message_id: replyToMessage} = await msg.reply.file(sticker, {fileName, asReply: true})
    return msg.reply.text('You can now forward this sticker to the @Stickers bot', {replyToMessage})
})

function convert(url) {
    return new Promise(resolve => https.request(url, response => {
        const form = new FormData();
        form.append('file', response);
        form.submit(API_URL, (err, res) => {
            const chunks = [];
            res.on('data', chunks.push.bind(chunks));
            res.on("end", () => resolve(Buffer.concat(chunks)));
        });
    }).end());
}

export default bot
