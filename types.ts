export interface Message {
  author: string;
  text: string;
  type: 'user' | 'bot';
}

export interface QueueUser {
  user: string;
  nickname?: string;
}

export interface CommandSetting {
  command: string;
  enabled: boolean;
}

export interface CommandSettings {
  join: CommandSetting;
  leave: CommandSetting;
  position: CommandSetting;
  nick: CommandSetting;
  next: CommandSetting;
  reset: CommandSetting;
  timerOn: CommandSetting;
  timerOff: CommandSetting;
  queueList: CommandSetting;
  playingList: CommandSetting;
}

export interface MessageSetting {
  text: string;
  enabled: boolean;
}

export interface MessageSettings {
  userExistsQueue: MessageSetting;
  userExistsPlaying: MessageSetting;
  userJoined: MessageSetting;
  joinWithTimer: MessageSetting;
  userPosition: MessageSetting;
  userIsPlaying: MessageSetting;
  notInQueue: MessageSetting;
  userLeft: MessageSetting;
  userNicknameUpdated: MessageSetting;
  nextUser: MessageSetting;
  nextInQueue: MessageSetting;
  queueEmpty: MessageSetting;
  reset: MessageSetting;
  timerOn: MessageSetting;
  timerOff: MessageSetting;
  removedForInactivityQueue: MessageSetting;
  thirtySecondWarning: MessageSetting;
  queueList: MessageSetting;
  queueListEmpty: MessageSetting;
  playingList: MessageSetting;
  playingListEmpty: MessageSetting;
}

export interface CustomCommand {
  command: string;
  response: string;
}

export interface LoyaltySetting {
  pointsPerInterval: number;
  intervalMinutes: number;
  enabled: boolean;
}

export interface AppSettings {
  botName: string;
  commands: CommandSettings;
  messages: MessageSettings;
  customCommands: CustomCommand[];
  youtubeChannelId?: string;
  loyalty?: LoyaltySetting;
}