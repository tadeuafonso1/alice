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
  cost?: number;
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
  participate: CommandSetting;
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
  thisIsAWarning: MessageSetting;
  removedForInactivityQueue: MessageSetting;
  thirtySecondWarning: MessageSetting;
  queueList: MessageSetting;
  queueListEmpty: MessageSetting;
  playingList: MessageSetting;
  playingListEmpty: MessageSetting;
  userParticipating: MessageSetting;
  userPoints: MessageSetting;
  insufficientPoints: MessageSetting;
}

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerMessage: number;
  pointsPerInterval: number;
  intervalMinutes: number;
  requireOnline: boolean;
}

export interface CustomCommand {
  command: string;
  response: string;
}

export interface AppSettings {
  botName: string;
  commands: CommandSettings;
  messages: MessageSettings;
  customCommands: CustomCommand[];
  loyalty: LoyaltySettings;
  youtubeChannelId?: string;
}

export interface LivePixSettings {
  user_id: string;
  enabled: boolean;
  client_id: string;
  client_secret: string;
  skip_queue_enabled: boolean;
  skip_queue_price: number;
  skip_queue_message: string;
  points_per_real: number;
  webhook_secret: string;
  updated_at?: string;
}

export interface SubscriberGoal {
  user_id: string;
  current_subs: number;
  initial_subs: number;
  current_goal: number;
  step: number;
  auto_update: boolean;
  bar_color: string;
  bg_color: string;
  border_color: string;
  text_color: string;
  stream_found: boolean;
  updated_at?: string;
}