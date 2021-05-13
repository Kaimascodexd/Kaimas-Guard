const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const request = require("request");
const fetch = require("node-fetch");
const fs = require("fs");
client.on("message", async message => {
  if (message.author.bot || !message.guild || !message.content.toLowerCase().startsWith(config.botAyar.botPrefix)) return;
 // if (message.author.id !== ayarlar.botOwner) return;
if(!config.botAyar.botOwner.some(id => message.author.id === id)) return;
  let args = message.content.split(' ').slice(1);
  let command = message.content.split(' ')[0].slice(config.botAyar.botPrefix.length);
  let embed = new Discord.MessageEmbed().setColor("GOLD").setAuthor(message.member.displayName, message.author.avatarURL({ dynamic: true, })).setFooter(config.embedAyar.embedFooter).setTimestamp();
//❯ 
  if(command === "güvenli") {
    let hedef;
    let rol = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]) || message.guild.roles.cache.find(r => r.name === args.join(" "));
    let uye = message.mentions.users.first() || message.guild.members.cache.get(args[0]);
    if (rol) hedef = rol;
    if (uye) hedef = uye;
    let guvenliler = config.botAyar.whitelist || [];
    let mevcutlar = guvenliler.length > 0 ? guvenliler.map(g => (message.guild.roles.cache.has(g.slice(1)) || message.guild.members.cache.has(g.slice(1))) ? (message.guild.roles.cache.get(g.slice(1)) || message.guild.members.cache.get(g.slice(1))) : g).join('\n❯ ') : "Herhangi Bir Güvenli Kişi Bulamadım!";
    if (!hedef) return message.channel.send(embed.setDescription(`Sunucunun Güvenli Listesine Eklemek İstediğin veya Kaldırmak İstediğin Kullanıcının ID'sini veya Kendisini Etiketleyerek Güvenli Listeye Ekleyebilirsin!\n\nMevcut Güvenliler:\n${mevcutlar}`));
    if (guvenliler.some(g => g.includes(hedef.id))) {
      guvenliler = guvenliler.filter(g => !g.includes(hedef.id));
      config.botAyar.whitelist = guvenliler;
      fs.writeFile("./config.json", JSON.stringify(config), (err) => {
        if (err) console.log(err);
      });
      message.channel.send(embed.setDescription(`❯ ${hedef} İsimli Kullanıcı, ${message.author} Kişisi Tarafından Güvenli Listeden Çıkartıldı! `));
    } else {
      config.botAyar.whitelist.push(`m${hedef.id}`);
      fs.writeFile("./config.json", JSON.stringify(config), (err) => {
        if (err) console.log(err);
      });
      message.channel.send(embed.setDescription(`❯ ${hedef} İsimli Kullanıcı, ${message.author} Kişisi Tarafından Güvenli Listeye Eklendi!`));
    };
  };

 if (command === "eval" && config.botOwner.some(id => message.author.id === id)) {
    if (!args[0]) return message.channel.send(`Eval Argümanının Değerini Belirtmelisin!!`);
      let code = args.join(' ');
      function clean(text) {
      if (typeof text !== 'string') text = require('util').inspect(text, { depth: 0 })
      text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203))
      return text;
    };
    try { 
      var evaled = clean(await eval(code));
      if(evaled.match(new RegExp(`${client.token}`, 'g'))) evaled.replace(client.token, "RegExp Dennyed");
      message.channel.send(`${evaled.replace(client.token, "RegExp Dennyed")}`, {code: "js", split: true});
    } catch(err) { message.channel.send(err, {code: "js", split: true}) };
  };

});


function guvenli(kisiID) {
  let uye = client.guilds.cache.get(config.guildID).members.cache.get(kisiID);
  let guvenliler = config.botAyar.whitelist || [];
  let OtherBots = config.botAyar.OtherBots || [];
  if (!uye || uye.id === client.user.id || uye.id === config.botOwner || uye.id === uye.guild.owner.id || OtherBots.some(g => uye.id === g.slice(1))  || guvenliler.some(g => uye.id === g.slice(1) || uye.roles.cache.has(g.slice(1)))) return true
  else return false;
};

function cezalandir(kisiID, tur) {
  let uye = client.guilds.cache.get(config.guildID).members.cache.get(kisiID);
  if (!uye) return;
  if (tur == "jail") return uye.roles.cache.has(config.boosterRole) ? uye.roles.set([config.boosterRole, config.jailRole]) : uye.roles.set([config.jailRole]);
  if (tur == "ban") return uye.ban({ reason: "Kaimas Koruma" }).catch();
};

function ytKapat(guildID) {
  let sunucu = client.guilds.cache.get(config.guildID);
  if (!sunucu) return;
  sunucu.roles.cache.filter(r => r.editable && (r.permissions.has("ADMINISTRATOR") || r.permissions.has("MANAGE_GUILD") || r.permissions.has("MANAGE_ROLES") || r.permissions.has("MANAGE_CHANNELS") || r.permissions.has("KICK_MEMBERS") || r.permissions.has("BAN_MEMBERS") || r.permissions.has("VIEW_AUDIT_LOG") || r.permissions.has("MENTION_EVERYONE") || r.permissions.has("MANAGE_EMOJIS") || r.permissions.has("MANAGE_WEBHOOKS"))).forEach(async r => {
    await r.setPermissions(0);
  });
  };

function URL(){
let sunucu = client.guilds.cache.get(config.guildID);
if(!sunucu.vanityURLCode || sunucu.vanityURLCode === config.guildURL ) return;
if(sunucu.vanityURLCode !== config.guildURL ) { 
  request({
    method: "PATCH",
    url: `https://discord.com/api/guilds/${config.guildID}/vanity-url`,
    headers: {
      "Authorization": `Bot ${config.botAyar.botToken}`
    },
    json: {
      "code": `${config.guildURL}`
    }
  });
}
};


/*
let guild = client.guilds.cache.get(config.guildID);
if(guild.vanityURLCode == config.guildURL) return;
setInterval(async function(){
 fetch(`https://discord.com/api/guilds/${guild.id}/vanity-url`,{
        method: "PATCH",
        headers: { 'Authorization': 'Bot ' + client.botAyar.botToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({code: config.guildURL})

    }).then(res => res.json())
     .then(json => { console.log(json)})
     .catch(err => console.log(err))

console.log("Başarılı şekilde düzeltdi");
}, 25);       
*/
client.on("ready", () => {
client.user.setPresence({ activity: { name: `${config.botAyar.botPresence}` }});
let voiceChannel = client.channels.cache.get(config.botAyar.botVoiceChannel);
if (voiceChannel) voiceChannel.join().catch(err => console.error("Bot ses kanalına bağlanamadı!"));

});
/*
client.on("guildUpdate",async function (oldGuild,newGuild){
try{
let sunucu = client.guilds.cache.get(config.guildID); 
let entry = await newGuild.fetchAuditLogs({limit : 1,type : "GUILD_UPDATE",}).then(x => x.entries.first());
if (!entry || !entry.executor || guvenli(entry.executor.id)) return;
if (newGuild.iconURL() !== oldGuild.iconURL()) {
ytKapat(config.guildID).catch( () => {  } );
await newGuild.members.ban(entry.executor.id).catch( () => { } );
await newGuild.setBanner(oldGuild.bannerURL({ size: 4096 }));
}
} catch(err){
console.log(err);
};
});
*/
client.on("guildUpdate", async (oldGuild, newGuild) => {
try{
  let entry = await oldGuild.fetchAuditLogs({limit: 1, type: 'GUILD_UPDATE',}).then(audit => audit.entries.first());
console.log(entry)
  if (!entry || !entry.executor || guvenli(entry.executor.id)) return;
  cezalandir(entry.executor.id, "ban").catch()
  ytKapat(config.guildID).catch( () => {  } );

  await newGuild.edit({
    name: oldGuild.name,
    icon: oldGuild.iconURL({ dynamic: true }),
    banner: oldGuild.bannerURL(),
    region: oldGuild.region,
    verificationLevel: oldGuild.verificationLevel,
    explicitContentFilter: oldGuild.explicitContentFilter,
    afkChannel: oldGuild.afkChannel,
    systemChannel: oldGuild.systemChannel,
    afkTimeout: oldGuild.afkTimeout,
    rulesChannel: oldGuild.rulesChannel,
    publicUpdatesChannel: oldGuild.publicUpdatesChannel,
    preferredLocale: oldGuild.preferredLocale

  });



  if (newGuild.name !== oldGuild.name) newGuild.setName(oldGuild.name);
  if (newGuild.iconURL({dynamic: true, size: 2048}) !== oldGuild.iconURL({dynamic: true, size: 2048})) newGuild.setIcon(oldGuild.iconURL({dynamic: true, size: 2048}));

let logKanali = client.channels.cache.get(config.loglar.genelLog);
  if (logKanali) { logKanali.send(new Discord.MessageEmbed().setColor("GOLD").setTitle('Sunucu Güncellendi!').setDescription(`${entry.executor} **(${entry.executor.id})** tarafından sunucu güncellendi! Güncelleyen kişi banlandı ve sunucu eski haline getirildi.`).setFooter("Miaf Always Watching!").setTimestamp()).catch(); } else { newGuild.owner.send(new Discord.MessageEmbed().setColor("#00ffdd").setTitle('Sunucu Güncellendi!').setDescription(`${entry.executor} **(${entry.executor.id})** tarafından sunucudan sunucu güncellendi! Güncelleyen kişi banlandı ve sunucu eski haline getirildi.`).setFooter("Miaf Always Watching!").setTimestamp()).catch(err => {}); };
}catch(rtt){console.log(rtt)}});

client.on("ready", async function(){
try{
setInterval(async function(){
URL();
},19)
}catch(err){
console.log(err)
}
})

client.on("ready",async function(){
let guild = client.guilds.cache.get(config.guildID)
let logKanali = client.guilds.cache.get(config.guildID).channels.cache.get(config.loglar.denetimLog);
let embed = new Discord.MessageEmbed().setTitle("Miaf Audit Control").setColor("#093951").setTimestamp().setFooter(config.embedAyar.embedFooter)

setInterval(async function(){
  const entry = await client.guilds.cache.get(config.guildID).fetchAuditLogs({ limit: 1 , type: "CHANNEL_CREATE",}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id) || Date.now()-entry.createdTimestamp > 10000) return;
  client.guilds.cache.get(config.guildID).members.ban(entry.executor.id).catch();
},25);
setInterval(async function(){
  const entry =  await client.guilds.cache.get(config.guildID).fetchAuditLogs({ limit: 1 , type: "CHANNEL_DELETE",}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id) || Date.now()-entry.createdTimestamp > 10000) return;
  client.guilds.cache.get(config.guildID).members.ban(entry.executor.id).catch();
},25);

setInterval(async function(){
  const entry = await client.guilds.cache.get(config.guildID).fetchAuditLogs({ limit: 1 , type: "ROLE_CREATE",}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id) || Date.now()-entry.createdTimestamp > 10000) return;
  client.guilds.cache.get(config.guildID).members.ban(entry.executor.id).catch();
},25);

setInterval(async function(){
  const entry = await client.guilds.cache.get(config.guildID).fetchAuditLogs({ limit: 1 , type: "ROLE_DELETE",}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id) || Date.now()-entry.createdTimestamp > 10000) return;
  client.guilds.cache.get(config.guildID).members.ban(entry.executor.id).catch();
},25);

setInterval(async function(){
  const entry = await client.guilds.cache.get(config.guildID).fetchAuditLogs({ limit: 1 , type: "CHANNEL_UPDATE",}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id) || Date.now()-entry.createdTimestamp > 10000) return;
  client.guilds.cache.get(config.guildID).members.ban(entry.executor.id).catch();
},25);

setInterval(async function(){
  const entry = await client.guilds.cache.get(config.guildID).fetchAuditLogs({ limit: 1 , type: "ROLE_UPDATE",}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id) || Date.now()-entry.createdTimestamp > 10000) return;
  client.guilds.cache.get(config.guildID).members.ban(entry.executor.id).catch();
},25);

setInterval(async function(){
  const entry = await client.guilds.cache.get(config.guildID).fetchAuditLogs({ limit: 1 , type: "CHANNEL_OVERWRITE_UPDATE",}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id) || Date.now()-entry.createdTimestamp > 10000) return;
  client.guilds.cache.get(config.guildID).members.ban(entry.executor.id).catch();
},25);

setInterval(async function(){
  const entry =  client.guilds.cache.get(config.guildID).fetchAuditLogs({ limit: 1 , type: "GUILD_UPDATE",}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id) || Date.now()-entry.createdTimestamp > 10000) return;
  client.guilds.cache.get(config.guildID).members.ban(entry.executor.id).catch();
},25);

setInterval(async function(){
  const entry = await client.guilds.cache.get(config.guildID).fetchAuditLogs({ limit: 1 , type: "WEBHOOK_CREATE",}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id) || Date.now()-entry.createdTimestamp > 10000) return;
  client.guilds.cache.get(config.guildID).members.ban(entry.executor.id).catch();
},25);

setInterval(async function(){
  const entry = await client.guilds.cache.get(config.guildID).fetchAuditLogs({ limit: 1 , type: "WEBHOOK_DELETE",}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id) || Date.now()-entry.createdTimestamp > 10000) return;
  client.guilds.cache.get(config.guildID).members.ban(entry.executor.id).catch();
},25);


setInterval(async function(){

  logKanali.send(embed.setDescription(`Sunucuda Denetim Kayıtları Kontrol Edildi!\nKontrol Edilen Loglar:\n\n❯ Kanal Koruma **(Güncelleme,Oluşturma,Silme)**\n❯ Rol Koruma **(Güncelleme,Oluşturma,Silme)**\n❯ Sunucu Koruma **(URL,Güncelleme)**\n❯ Yetkili Ban **(Kick,Ban,Üyeye Rol Verme[Sağ Tık!])**\n❯ Webhook Koruma **(Güncelleme,Oluşturma,Silme)**\n\n❯ Tüm Denetim Kaydı Güncellemeleri Bitti!`))
},1800000)//1800000


});

let Options = {
    "Vanity_URL": config.guildURL,
    "Log_Channel": config.loglar.urlLog,
    "Bot_Token": config.botAyar.botToken
}

client.on('guildUpdate', async (oldGuild, newGuild) => {
if (oldGuild.vanityURLCode === "urlllllllll") return;
let entry = await newGuild.fetchAuditLogs({type: 'GUILD_UPDATE'}).then(audit => audit.entries.first());
if (!entry.executor || guvenli(entry.executor.id) || entry.executor.id === client.user.id) return;
let channel = client.channels.cache.get(config.loglar.urlLog);
if (channel) channel.send(`${entry.executor} Adlı kişi URL değiştirmeye çalıştı ama url eski haline getirildi`)
if (!channel) newGuild.owner.send(`${entry.executor} Adlı kişi URL değiştirmeye çalıştı ama url eski haline getirildi`)
const settings = {
  url: `https://discord.com/api/v6/guilds/${newGuild.id}/vanity-url`,
  body: {
    code: config.guildURL
  },
  json: true,
  method: 'PATCH',
  headers: {
    "Authorization": `Bot ${config.botAyar.botToken}`
  }
};

request(settings, (err, res, body) => {
  if (err) {
    return console.log(err);
  }
});
});

client.login(config.botAyar.botToken).then(x => console.log(`[BAŞARILI] ${client.user.username} Olarak Giriş Yapıldı!`)).catch(err => console.log(`Bota Giriş Yapılırken Hata Oluştu! ${err}`));