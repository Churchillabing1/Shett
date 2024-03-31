const path = require('path');
const fs = require('fs-extra');
const ytdl = require('ytdl-core');
const yts = require('yt-search');

module.exports.config = {
		name: 'music',
		version: '1.0.0',
		credits: 'cliff',
		role: 0,
		aliases: ['m'],
		cooldown: 0,
		hasPrefix: false,
		usage: ''
};

module.exports.run = async function ({ api, event, args }) {
		const musicName = args.join(' ');

		if (!musicName) {
				api.sendMessage(`To get started, type music and the title of the song you want.`, event.threadID, event.messageID);
				return;
		}

		try {
				api.sendMessage(`Searching for "${musicName}"...`, event.threadID, async (err, info) => {
						if (err) return console.error(err);
						try {
								const searchResults = await yts(musicName);
								if (!searchResults.videos.length) {
										return api.sendMessage("Can't find the search.", event.threadID, event.messageID);
								}
								const music = searchResults.videos[0];
								const musicUrl = music.url;
								const stream = ytdl(musicUrl, { filter: 'audioonly' });
								const time = new Date();
								const timestamp = time.toISOString().replace(/[:.]/g, '-');
								const filePath = path.join(__dirname, 'cache', `${timestamp}_music.mp3`);

								stream.pipe(fs.createWriteStream(filePath));

								stream.on('response', () => {});
								stream.on('info', () => {});

								stream.on('end', () => {
										if (fs.statSync(filePath).size > 26214400) {
												fs.unlinkSync(filePath);
												return api.sendMessage('The file could not be sent because it is larger than 25MB.', event.threadID);
										}
										const message = {
												body: `${music.title}`,
												attachment: fs.createReadStream(filePath)
										};
										api.sendMessage(message, event.threadID, () => {
												fs.unlinkSync(filePath);
										});
								});
						} catch (error) {
								api.sendMessage('An error occurred while processing your request.', event.threadID, event.messageID);
						}
				});
		} catch (error) {
				api.sendMessage('An error occurred while processing your request.', event.threadID, event.messageID);
		}
};
