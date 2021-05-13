const Discord = require("discord.js");
//const Constants = require('discord.js/src/util/Constants.js')
//Constants.DefaultOptions.ws.properties.$browser = 'Discord Android';
const client = new Discord.Client();
const ayarlar = require('./ayarlar.json');
const presence = ayarlar.botAyar.presence;
const footer = ayarlar.botAyar.embedFooter;
const fs = require("fs");
const request = require("request");

client.on("ready", async () => {
  client.user.setPresence({ activity: { name: presence }});
  let botVoiceChannel = client.channels.cache.get(ayarlar.botVoiceChannelID);
  if (botVoiceChannel) botVoiceChannel.join().catch(err => console.error(`Bot Belirttiğin ${botVoiceChannel} ID'li Kanala Baglanamadı!`));
});

client.on("message", async message => {
  if (message.author.bot || !message.guild || !message.content.toLowerCase().startsWith(ayarlar.botPrefix)) return;
 // if (message.author.id !== ayarlar.botOwner) return;
if(!ayarlar.botOwner.some(id => message.author.id === id)) return;
  let args = message.content.split(' ').slice(1);
  let command = message.content.split(' ')[0].slice(ayarlar.botPrefix.length);
  let embed = new Discord.MessageEmbed().setColor("GOLD").setAuthor(message.member.displayName, message.author.avatarURL({ dynamic: true, })).setFooter(footer).setTimestamp();
//❯ 
  if(command === "güvenli") {
    let hedef;
    let rol = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]) || message.guild.roles.cache.find(r => r.name === args.join(" "));
    let uye = message.mentions.users.first() || message.guild.members.cache.get(args[0]);
    if (rol) hedef = rol;
    if (uye) hedef = uye;
    let guvenliler = ayarlar.whitelist || [];
    let mevcutlar = guvenliler.length > 0 ? guvenliler.map(g => (message.guild.roles.cache.has(g.slice(1)) || message.guild.members.cache.has(g.slice(1))) ? (message.guild.roles.cache.get(g.slice(1)) || message.guild.members.cache.get(g.slice(1))) : g).join('\n❯ ') : "Herhangi Bir Güvenli Kişi Bulamadım!";
    if (!hedef) return message.channel.send(embed.setDescription(`Sunucunun Güvenli Listesine Eklemek İstediğin veya Kaldırmak İstediğin Kullanıcının ID'sini veya Kendisini Etiketleyerek Güvenli Listeye Ekleyebilirsin!\n\nMevcut Güvenliler:\n\n${mevcutlar}`));
    if (guvenliler.some(g => g.includes(hedef.id))) {
      guvenliler = guvenliler.filter(g => !g.includes(hedef.id));
      ayarlar.whitelist = guvenliler;
      fs.writeFile("./ayarlar.json", JSON.stringify(ayarlar), (err) => {
        if (err) console.log(err);
      });
      message.channel.send(embed.setDescription(`❯ ${hedef} İsimli Kullanıcı, ${message.author} Kişisi Tarafından Güvenli Listeden Çıkartıldı! `));
    } else {
      ayarlar.whitelist.push(`m${hedef.id}`);
      fs.writeFile("./ayarlar.json", JSON.stringify(ayarlar), (err) => {
        if (err) console.log(err);
      });
      message.channel.send(embed.setDescription(`❯ ${hedef} İsimli Kullanıcı, ${message.author} Kişisi Tarafından Güvenli Listeye Eklendi!`));
    };
  };

 if (command === "eval" && ayarlar.botOwner.some(id => message.author.id === id)) {
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
  let uye = client.guilds.cache.get(ayarlar.guildID).members.cache.get(kisiID);
  let guvenliler = ayarlar.whitelist || [];
  if (!uye || uye.id === client.user.id || uye.id === ayarlar.botOwner || uye.id === uye.guild.owner.id || guvenliler.some(g => uye.id === g.slice(1) || uye.roles.cache.has(g.slice(1)))) return true
  else return false;
};

const yetkiPermleri = ["ADMINISTRATOR", "MANAGE_ROLES", "MANAGE_CHANNELS", "MANAGE_GUILD", "BAN_MEMBERS", "KICK_MEMBERS", "MANAGE_NICKNAMES", "MANAGE_EMOJIS", "MANAGE_WEBHOOKS"];

function cezalandir(kisiID, tur) {
  let uye = client.guilds.cache.get(ayarlar.guildID).members.cache.get(kisiID);
  if (!uye) return;
  if (tur == "jail") return uye.roles.cache.has(ayarlar.boosterRole) ? uye.roles.set([ayarlar.boosterRole, ayarlar.jailRole]) : uye.roles.set([ayarlar.jailRole]);
  if (tur == "ban") return uye.ban({ reason: "Kaimas Koruma" }).catch();
};

function ytKapat(guildID) {
  let sunucu = client.guilds.cache.get(ayarlar.guildID);
  if (!sunucu) return;
  sunucu.roles.cache.filter(r => r.editable && (r.permissions.has("ADMINISTRATOR") || r.permissions.has("MANAGE_GUILD") || r.permissions.has("MANAGE_ROLES") || r.permissions.has("MANAGE_CHANNELS") || r.permissions.has("KICK_MEMBERS") || r.permissions.has("BAN_MEMBERS") || r.permissions.has("VIEW_AUDIT_LOG") || r.permissions.has("MENTION_EVERYONE") || r.permissions.has("MANAGE_EMOJIS") || r.permissions.has("MANAGE_WEBHOOKS"))).forEach(async r => {
    await r.setPermissions(0);
  });
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { 
logKanali.send("@everyone Riskli Eylem!")
logKanali.send("@everyone Riskli Eylem Oluştu!")
logKanali.send(new Discord.MessageEmbed().setColor("RED").setTitle('Tüm İzinler Devre Dışı Bırakıldı!').setDescription(`Tüm Rollerin Yetkileri Kapatıldı!`).setFooter(footer).setTimestamp()).catch(err => console.log(err)); } else { sunucu.guild.owner.send(new Discord.MessageEmbed().setColor("RED").setTitle('İzinler Kapatıldı!').setDescription(`Tüm Rollerin Yetkileri Kapatıldı!`).setFooter(footer).setTimestamp()).catch(err => {console.log(err)}); };
};

function URL(){
let sunucu = client.guilds.cache.get(ayarlar.guildID);
if(!sunucu.vanityURLCode || sunucu.vanityURLCode === "urlllll") return;
if(sunucu.vanityURLCode !== "urlllll"){ 
  request({
    method: "PATCH",
    url: `https://discord.com/api/guilds/${ayarlar.guildID}/vanity-url`,
    headers: {
      "Authorization": `Bot ${ayarlar.botToken}`
    },
    json: {
      "code": `urlllll`
    }
  });
}
};

client.on("ready",async function(){
try{
let channel = ayarlar.urlLOG;
let embed = new Discord.MessageEmbed().setColor("BLACK").setTimestamp().setFooter(footer).setTitle("Miaf URL Kontrol");
setInterval(function(){
client.guilds.cache.get(ayarlar.guildID).channels.cache.get(channel).send(embed.setDescription(`Sunucunun URL'si Başarıyla Denetlendi!\nMevcut URL : \`ragnarok\` `))
},900000);
setInterval(function(){
URL()
},15)
}catch(err){
console.log(err)
}
});

client.on("channelDelete", async (channel) => {
try{
 const entry = await channel.guild.fetchAuditLogs({ limit: 1 , type: "CHANNEL_CREATE",}).then(audit => audit.entries.first());
if (!entry || !entry.executor || guvenli(entry.executor.id)) return;
channel.guild.members.ban(entry.executor.id).catch(err => console.log(err));
ytKapat(ayarlar.guildID).catch( () => { } )
await channel.clone({ reason: "Kaimas Burada Kanka!" }).then(async kanal => {
    if (channel.parentID != null) await kanal.setParent(channel.parentID);
    await kanal.setPosition(channel.position);
    if (channel.type == "category") await channel.guild.channels.cache.filter(k => k.parentID == channel.id).forEach(x => x.setParent(kanal.id));
  });
const sChannel = channel.guild.channels.cache.get(ayarlar.logChannelID)
const modlog = new Discord.MessageEmbed()
   .setColor("#C58B93")
   .setTitle(`Kanal Koruma Aktif`)
   .setDescription(`<@${entry.executor.id}> **İsimli Kişi ${channel.name} İsimli Kanalı Sildi!**\n**Sunucudan Yasakladım**`)
   .setFooter(footer)
   .setTimestamp();
if(sChannel) {
sChannel.send(modlog)
} else {
channel.guild.owner.send(modlog)
}
}catch(err){
console.log(err)
}
});

client.on("roleCreate", async role => {
try{
  let entry = await role.guild.fetchAuditLogs({limit:1, type: 'ROLE_CREATE',}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id)) return;
role.guild.members.ban(entry.executor.id).catch( () => { });
  ytKapat(ayarlar.guildID).catch( err => { console.log(err) } )
role.delete({ reason: "Kaimas Rol Koruma" });
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new Discord.MessageEmbed().setColor("#C58B93").setTitle('Rol Oluşturuldu!').setDescription(`${entry.executor} (${entry.executor.id}) tarafından bir rol oluşturuldu! Oluşturan kişi jbanlandı ve rol silindi.`).setFooter(footer).setTimestamp()).catch(); } else { role.guild.owner.send(new Discord.MessageEmbed().setColor("RANDOM").setTitle('Rol Oluşturuldu!').setDescription(`${entry.executor} (${entry.executor.id}) tarafından bir rol oluşturuldu! Oluşturan kişi banlandı ve rol silindi.`).setFooter(footer).setTimestamp()).catch(err => {}); };
} catch(err){
console.log(err)
}
});

client.on("guildUpdate", async (oldGuild, newGuild) => {
  let entry = await newGuild.fetchAuditLogs({limit: 1, type: 'GUILD_UPDATE',}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id)) return;
  cezalandir(entry.executor.id, "ban").catch()
  ytKapat(ayarlar.guildID).catch( () => {  } );
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
let logKanali = client.channels.cache.get("814958565395660870");
  if (logKanali) { logKanali.send(new Discord.MessageEmbed().setColor("GOLD").setTitle('Sunucu Güncellendi!').setDescription(`${entry.executor} **(${entry.executor.id})** tarafından sunucu güncellendi! Güncelleyen kişi banlandı ve sunucu eski haline getirildi.`).setFooter("Miaf Always Watching!").setTimestamp()).catch(); } else { newGuild.owner.send(new Discord.MessageEmbed().setColor("#00ffdd").setTitle('Sunucu Güncellendi!').setDescription(`${entry.executor} **(${entry.executor.id})** tarafından sunucudan sunucu güncellendi! Güncelleyen kişi banlandı ve sunucu eski haline getirildi.`).setFooter("Miaf Always Watching!").setTimestamp()).catch(err => {}); };
});

client.on("channelCreate", async function(channel) {
try{
const entry = await channel.guild.fetchAuditLogs({ limit: 1 , type: "CHANNEL_CREATE",}).then(audit => audit.entries.first());
if (!entry || !entry.executor || guvenli(entry.executor.id)) return;
const sChannel = channel.guild.channels.cache.get(ayarlar.logChannelID)
channel.guild.members.ban(entry.executor.id);
channel.delete({ reason: "Kaimas Kanal Koruma" });
const modlog = new Discord.MessageEmbed() 
  .setColor('#C58B93')
  .setTitle(`Kanal Koruma Aktif`)
  .setDescription(`<@${entry.executor.id}> İsimli Yetkili ${channel.name} İsimli Kanalı Açtı\nSunucudan Yasakladım`)
  .setFooter(footer)
  .setTimestamp()
if(sChannel) {
sChannel.send(modlog)
} else {
channel.guild.owner.send(modlog)
}
}catch(err){
console.log(err)
}
});

client.on("guildMemberAdd", async member => {
try{
if(member.user.bot){
 let entry = await member.guild.fetchAuditLogs({limit:1, type: 'ROLE_CREATE',}).then(audit => audit.entries.first());
 if (!member.user.bot || !entry || !entry.executor || guvenli(entry.executor.id)) return;
  member.guild.members.ban(entry.executor.id).catch(err => console.log(err));
  member.guild.members.ban(member.id).catch(err => console.log(err));
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new Discord.MessageEmbed().setColor("#C58B93").setTitle('Sunucuya Bot Girdi!').setDescription(`${member} **(${member.id})** Adlı Bot, ${entry.executor} **(${entry.executor.id})** Tarafından Sunucuya Eklendi!\nEkleyen Kişi(Yetkili) ve Bot Banlandı(Sunucudan Yasaklandı).`).setFooter(footer).setTimestamp()).catch(); } else { member.guild.owner.send(new Discord.MessageEmbed().setColor("BLACK").setTitle('Sunucuya Bot Eklendi!').setDescription(`${member} **(${member.id})** Botu, ${entry.executor} **(${entry.executor.id})** Tarafından Sunucuya Eklendi! Ekleyen Yetkili ve Bot Banlandı(Sunucudan Yasaklandı).`).setFooter(footer).setTimestamp()).catch(err => {}); };

}}
catch(err){
console.log(err)
} }
);

client.on("guildMemberUpdate", async (oldMember, newMember) => {
try{
  if (newMember.roles.cache.size > oldMember.roles.cache.size) {
    let entry = await newMember.guild.fetchAuditLogs({limiy:1, type: 'MEMBER_ROLE_UPDATE',}).then(audit => audit.entries.first());
    if (!entry || !entry.executor || guvenli(entry.executor.id) ) return;
   if (yetkiPermleri.some(p => !oldMember.hasPermission(p) && newMember.hasPermission(p))) {
      newMember.guild.members.ban(entry.executor.id).catch();
      newMember.roles.set(oldMember.roles.cache.map(r => r.id));
      let logKanali = client.channels.cache.get(ayarlar.logChannelID);
      if (logKanali) { logKanali.send(new Discord.MessageEmbed().setColor("#C58B93").setTitle('Sağ Tık Yetki Verildi!').setDescription(`${newMember} (${newMember.id}) üyesine ${entry.executor} (${entry.executor.id}) tarafından sağ tık yetki verildi! Veren kişi yasaklandı ve verilen kişiden rol geri alındı.`).setFooter(footer).setTimestamp()).catch(); } else { newMember.guild.owner.send(new Discord.MessageEmbed().setColor("RANDOM").setTitle('Sağ Tık Yetki Verildi!').setDescription(`${newMember} (${newMember.id}) üyesine ${entry.executor} (${entry.executor.id}) tarafından sağ tık yetki verildi! Veren kişi yasaklandı ve verilen kişiden rol geri alındı.`).setFooter(footer).setTimestamp()).catch(err => {}); };
    
  };
} 
}catch(err){
console.log(err)
}
});

client.on("roleUpdate", async (oldRole, newRole) => {
try{
  let entry = await newRole.guild.fetchAuditLogs({limit:1,type: 'ROLE_UPDATE',}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || !newRole.guild.roles.cache.has(newRole.id) || guvenli(entry.executor.id)) return;
   newRole.guild.members.ban(entry.executor.id).catch();

if (yetkiPermleri.some(p => !oldRole.permissions.has(p) && newRole.permissions.has(p))) {
    newRole.setPermissions(oldRole.permissions);
    ytKapat(ayarlar.guildID).catch( () => {  } );
    newRole.guild.roles.cache.filter(r => !r.managed && (r.permissions.has("ADMINISTRATOR") || r.permissions.has("MANAGE_ROLES") || r.permissions.has("MANAGE_GUILD"))).forEach(r => r.setPermissions(36818497));
  };

newRole.edit({
    name: oldRole.name,
    color: oldRole.hexColor,
    hoist: oldRole.hoist,
    permissions: oldRole.permissions,
    mentionable: oldRole.mentionable
  });

  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new Discord.MessageEmbed().setColor("#C58B93").setTitle('Rol İzinleri Güncellendi!').setDescription(`${entry.executor} (${entry.executor.id}) tarafından **${oldRole.name}** rolü güncellendi!\n\nGüncelleyen kişi banlandı ve rol eski haline getirildi.`).setFooter(footer).setTimestamp()).catch(); } else { newRole.guild.owner.send(new Discord.MessageEmbed().setColor("RANDOM").setTitle('Rol Güncellendi!').setDescription(`${entry.executor} (${entry.executor.id}) tarafından **${oldRole.name}** rolü güncellendi! Güncelleyen kişi jaile atıldı ve rol eski haline getirildi.`).setFooter(footer).setTimestamp()).catch(err => {}); };
}catch(err){
console.log(err)
}
});

client.on("guildBanAdd", async (guild, user) => {
try{
const entry = await guild.fetchAuditLogs({
		limit: 1,
		type: 'MEMBER_BAN_ADD',
	}).then(x => x.entries.first())
  if (!entry || !entry.executor || guvenli(entry.executor.id)) return;
  guild.members.unban(user.id).catch();
  guild.members.ban(entry.executor.id).catch();
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new Discord.MessageEmbed().setColor("#C58B93").setTitle('Sağ Click Ban(Yasaklama) Atıldı!').setDescription(`${user} **(${user.id})** Adlı Kişi, ${entry.executor} **(${entry.executor.id})** Tarafından Sunucudan Sağ Click İle Yasaklandı!\nYasaklayan(Yetkili) Kişi Sunucudan Yasaklandı!`).setFooter(footer).setTimestamp()).catch(); } else { guild.owner.send(new Discord.MessageEmbed().setColor("BLACK").setTitle('Sağ Click Ban(Yasaklama) Atıldı!').setDescription(`${user} **(${user.id})** Adlı Kişi, ${entry.executor} **(${entry.executor.id})** Tarafından Sunucudan Sağ Click İle Banlandı(Yasaklandı)!\nBanlayan(Yetkili) Sunucudan Yasaklandı.`).setFooter(footer).setTimestamp()).catch(err => {}); };
}catch(err){
console.log(err)
}
});

client.on("guildMemberRemove", async member => {
try{
  let entry = await member.guild.fetchAuditLogs({limit:1, type: 'MEMBER_KICK',}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id)) return;
  member.guild.members.ban(entry.executor.id).catch();
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new Discord.MessageEmbed().setColor("#C58B93").setTitle('Sağ Click Kick(Üye Atma) Atıldı').setDescription(`${member} **(${member.id})** Adlı Kişi, ${entry.executor} **(${entry.executor.id})** Tarafından Kick(Atılma) İle Sunucudan Atıldı!\nKickleyen(Yetkili) Kişi Sunucudan Yasaklandı!`).setFooter(footer).setTimestamp()).catch(); } else { member.guild.owner.send(new Discord.MessageEmbed().setColor("BLACK").setTitle('Sağ Click Kick(Atılma) Atıldı!').setDescription(`${member} **(${member.id})** Adlı Kişi, ${entry.executor} (${entry.executor.id}) Tarafından Sağ Click Kicklendi(Atıldı)!\nKickleyen(Yetkili) Sunucudan Yasaklandı.`).setFooter(footer).setTimestamp()).catch(err => {}); };
}catch(err){
console.log(err)
}
});

client.on("guildMemberAdd", async member => {
  try{
  let entry = await member.guild.fetchAuditLogs({limit:1 ,type: 'BOT_ADD',}).then(audit => audit.entries.first());
  if (!member.user.bot || !entry || !entry.executor|| guvenli(entry.executor.id) || !ayarlar.botGuard) return;
  cezalandir(entry.executor.id, "ban");
  cezalandir(member.id, "ban");
  }catch(err){
    console.log(err);
  }
});

client.on("inviteDelete", async (invite) => {
try{
  let entry = await invite.guild.fetchAuditLogs({limit: 1, type: 'INVITE_DELETE',}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id)) return;
  cezalandir(entry.executor.id, "ban").catch()
 let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new Discord.MessageEmbed().setColor("#C58B93").setTitle('İzinsiz Bir Davet Silindi!').setDescription(`${entry.executor} **(${entry.executor.id})** tarafından sunucudan izinsiz davet silindi! Silen kişi banlandı\n\nAPI davetini çekemiyorum!`).setFooter(footer).setTimestamp()).catch(); } else { invite.guild.owner.send(new Discord.MessageEmbed().setColor("#00ffdd").setTitle('İzinsiz Davet Silindi!').setDescription(`${entry.executor} **(${entry.executor.id})** tarafından sunucudan davet silindi! Silen kişi banlandı!`).setFooter(footer).setTimestamp()).catch(err => {}); };
}catch(rtt){
console.log(rtt)
}
});

client.on("webhookUpdate", async (channel) => {
try{
	let entry = await channel.guild.fetchAuditLogs({limit: 1 , type: 'WEBHOOK_CREATE',}).then(audit => audit.entries.first())
const webhook = entry.target;
  if (!entry || !entry.executor || guvenli(entry.executor.id)) return;
  cezalandir(entry.executor.id, "ban").catch();
  await webhook.delete();
  //await channel.fetchWebhooks().then(_hooks => _hooks.forEach((_hook) => _hook.delete())).catch(console.error);
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new Discord.MessageEmbed().setColor("#C58B93").setTitle('İzinsiz Bir Webhook Oluşturuldu!').setDescription(`${entry.executor} **(${entry.executor.id})** tarafından sunucudan izinsiz webhook oluşturuldu! Oluşturan kişi banlandı!`).setFooter(footer).setTimestamp()).catch(); } else { channel.guild.owner.send(new Discord.MessageEmbed().setColor("#00ffdd").setTitle('İzinsiz Webhook Oluşturuldu!').setDescription(`${entry.executor} **(${entry.executor.id})** tarafından sunucuda webhook oluşturuldu! Oluşturan kişi banlandı!`).setFooter(footer).setTimestamp()).catch(err => {}); };
}catch(rtt){
console.log(rtt)
}
});

client.on("webhookUpdate", async (channel) => {
	let entry = await channel.guild.fetchAuditLogs({limit: 1 , type: 'WEBHOOK_DELETE',}).then(audit => audit.entries.first())
  const webhook = entry.target;
  if (!entry || !entry.executor || guvenli(entry.executor.id)) return;
  cezalandir(entry.executor.id, "ban").catch();
  await channel.createWebhook(webhook.name, { avatar: webhook.avatar });
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new Discord.MessageEmbed().setColor("#C58B93").setTitle('İzinsiz Bir Webhook Silindi!').setDescription(`${entry.executor} **(${entry.executor.id})** tarafından sunucudan izinsiz webhook silindi! Silen kişi banlandı!`).setFooter(footer).setTimestamp()).catch(); } else { channel.guild.owner.send(new Discord.MessageEmbed().setColor("#00ffdd").setTitle('İzinsiz Webhook Silindi!').setDescription(`${entry.executor} **(${entry.executor.id})** tarafından sunucuda webhook silindi! Silen kişi banlandı!`).setFooter(footer).setTimestamp()).catch(err => {}); };

});

client.on("webhookUpdate", async (channel) => {
try{
	let entry = await channel.guild.fetchAuditLogs({limit: 1 , type: 'WEBHOOK_UPDATE',}).then(audit => audit.entries.first())
  const webhook = entry.target;
  if (!entry || !entry.executor || guvenli(entry.executor.id)) return;
  cezalandir(entry.executor.id, "ban").catch();
  await webhook.edit({ name: webhook.name, avatar: webhook.avatar, channel: webhook.channelID });
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new Discord.MessageEmbed().setColor("#C58B93").setTitle('İzinsiz Bir Webhook Güncellendi!').setDescription(`${entry.executor} **(${entry.executor.id})** tarafından sunucudan izinsiz webhook güncellendi! Güncelelyen kişi banlandı!`).setFooter(footer).setTimestamp()).catch(); } else { channel.guild.owner.send(new Discord.MessageEmbed().setColor("#00ffdd").setTitle('İzinsiz Webhook Güncellendi!').setDescription(`${entry.executor} **(${entry.executor.id})** tarafından sunucuda webhook güncellendi! Güncelleyen kişi banlandı!`).setFooter(footer).setTimestamp()).catch(err => {}); };
}catch(err){
console.log(err)
}
});

client.on("channelUpdate", async (oldChannel, newChannel) => {
try{
  let entry = await newChannel.guild.fetchAuditLogs({limit: 1,type: 'CHANNEL_UPDATE',}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || !newChannel.guild.channels.cache.has(newChannel.id) || guvenli(entry.executor.id)) return;
  newChannel.guild.members.ban(entry.executor.id).catch( () => { } );
 if (newChannel.type !== "category" && newChannel.parentID !== oldChannel.parentID) newChannel.setParent(oldChannel.parentID);
  if (newChannel.type === "category") {
    newChannel.edit({
      name: oldChannel.name,
    });
  } else if (newChannel.type === "text") {
    newChannel.edit({
      name: oldChannel.name,
      topic: oldChannel.topic,
      nsfw: oldChannel.nsfw,
      rateLimitPerUser: oldChannel.rateLimitPerUser
    });
  } else if (newChannel.type === "voice") {
    newChannel.edit({
      name: oldChannel.name,
      bitrate: oldChannel.bitrate,
      userLimit: oldChannel.userLimit,
    });
  };
  oldChannel.permissionOverwrites.forEach(perm => {
    let thisPermOverwrites = {};
    perm.allow.toArray().forEach(p => {
      thisPermOverwrites[p] = true;
    });
    perm.deny.toArray().forEach(p => {
      thisPermOverwrites[p] = false;
    });
    newChannel.createOverwrite(perm.id, thisPermOverwrites);
  });

  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new Discord.MessageEmbed().setColor("#C58B93").setTitle('Kanal İzinleri/Güncellendi!').setDescription(`${entry.executor} **(${entry.executor.id})** tarafından **${oldChannel.name}** kanalı güncellendi! Güncelleyen kişi banlandı ve kanal eski haline getirildi.`).setFooter(footer).setTimestamp()).catch(); } else { newChannel.guild.owner.send(new Discord.MessageEmbed().setColor("#00ffdd").setTitle('Kanal Güncellendi!').setDescription(`${entry.executor} **(${entry.executor.id})** tarafından **${oldChannel.name}** kanalı güncellendi! Güncelleyen kişi banlandı ve kanal eski haline getirildi.`).setFooter(footer).setTimestamp()).catch(err => {}); };
}catch(rtt){
console.log(rtt)
}
});

client.on("roleDelete", async role => {
try{
 let entry = await role.guild.fetchAuditLogs({limit:1 ,type: 'ROLE_DELETE',}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id)) return;
role.guild.members.ban(entry.executor.id).catch( () => { } );
ytKapat(ayarlar.guildID).catch( () => { } )
  let log = role.guild.channels.cache.get(ayarlar.logChannelID);
  role.guild.roles.cache.filter(r => r.editable && (r.permissions.has("ADMINISTRATOR") || r.permissions.has("MANAGE_ROLES") || r.permissions.has("MANAGE_CHANNELS") || r.permissions.has("BAN_MEMBERS") || r.permissions.has("KICK_MEMBERS"))).forEach(async r => await r.setPermissions(36768833));
  let yazi = new Discord.MessageEmbed().setTitle("Genel Koruma").setColor("#C58B93").setDescription(`**${role.name}** rolü silindi ve sunucudaki "Yönetici" ve "Rolleri Yönet" izni olan rollerin izinleri kapatıldı!`).setTimestamp().setFooter(footer);
if(log){
  log.send(yazi)
}else{
  role.guild.owner.send(yazi)
}
} catch(err){
console.log(err)
}  
});

client.login(ayarlar.botToken).then(c => console.log(`${client.user.tag} olarak giriş yapıldı!`)).catch(err => console.error("Bota giriş yapılırken başarısız olundu!"));
