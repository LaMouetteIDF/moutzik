import { Youtube } from '@/services/download/youtube';
import { Message, MessageEmbed, TextChannel, VoiceChannel } from 'discord.js';
import { SQLiteProvider } from 'discord.js-commando';
import {
  ArgumentCollectorResult,
  Command,
  CommandoClient,
  CommandoMessage,
} from 'discord.js-commando';

type Args = {
  target: string;
};

export class Play extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'play',
      group: 'music',
      memberName: 'play',
      description: 'Plays loaded queue',
      examples: ['play', 'play <VIDEO-URL>'],
      guildOnly: true,
      // clientPermissions: ['CONNECT', 'SPEAK'],
      args: [
        {
          key: 'target',
          prompt: 'Target',
          type: 'string',
          default: '',
        },
      ],
    });

    try {
      this._initListeners();
    } catch (e) {
      console.log('Failed to initialize PlayCommand listeners', e);
    }
  }

  async run(
    message: CommandoMessage,
    args: Args,
    _fromPattern: boolean,
    _result?: ArgumentCollectorResult<object>,
  ): Promise<Message | Message[]> {
    const download = this.client.download;
    const music = this.client.music;

    const guild = message.guild;

    let channel: TextChannel;
    if (message.channel instanceof TextChannel) {
      channel = message.channel;
    } else return;

    try {
      if (args.target) {
        await music.joinChannel(guild, channel, message.member?.voice.channel);

        const tracks = await download.getInfo(args.target);

        for (const track of tracks) {
          if (track.live)
            throw new Error(
              "This command don't accept live stream link. Please use stream command (e.g.: !steam <STREAM-URL>).",
            );
        }

        music.play(guild, channel, tracks);
      } else if (!args.target) {
        if (message.channel instanceof TextChannel) music.resume(message.guild);
      }
    } catch (e) {
      message.reply(`Error: \`${e.message}\``);
    }
  }

  private _initListeners() {
    this.client.music.on('play', (text, _guild, channel) => {
      channel.send(text);
    });
  }
}
