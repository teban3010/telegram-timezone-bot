import { Chat, Message, User } from 'node-telegram-bot-api';
import { increment, list } from './database';

import { API } from 'lib/api';
import bot from 'lib/bot';
import { format } from 'date-fns';
import { getTimezones } from './timezones';

const getDate = (dateTime: string) => {
  const splitDateTime = dateTime.split('T');
  const splitDate = splitDateTime[0].split('-');
  const splitTime = splitDateTime[1].split(':');

  return new Date(
    +splitDate[0],
    +splitDate[1] - 1,
    +splitDate[2],
    +splitTime[0],
    +splitTime[1],
  );
};

export const timeAt = async (
  message: string,
  chat: Chat,
  user: User,
  timezones: string[],
) => {
  let timezone = message;

  const possibleTimezones = timezones.filter((t) =>
    t.toLocaleLowerCase().includes(message.toLocaleLowerCase()),
  );

  if (possibleTimezones.length !== 1) {
    await bot.sendMessage(
      chat.id,
      `@${user.username}: unknown timezone ${message}`,
    );

    return;
  } else {
    timezone = possibleTimezones[0];
  }

  let result;

  try {
    result = await API.get(`timezone/${timezone}`);
  } catch (error) {
    await bot.sendMessage(
      chat.id,
      `@${user.username}: timezones service is currently unavailable, please try again later`,
    );

    return null;
  }

  await increment(result.timezone);
  await increment(result.abbreviation);

  await bot.sendMessage(
    chat.id,
    `@${user.username}: ${message} timeat is ${format(
      getDate(result.datetime),
      'd MMM y HH:mm',
    )}`,
  );
};

export const timePopularity = async (
  message: string,
  chat: Chat,
  user: User,
  timezones: string[],
) => {
  const timezone = timezones.some((t) =>
    t.toLocaleLowerCase().startsWith(message.toLocaleLowerCase()),
  )
    ? message
    : timezones.find((t) =>
        t.toLocaleLowerCase().includes(message.toLocaleLowerCase()),
      );

  let result = 0;

  const values = await list(timezone || message);
  for (const [key, value] of values) {
    result += parseInt(value);
  }

  await bot.sendMessage(
    chat.id,
    `@${user.username}: ${message} have been called ${result} times`,
  );
};

const defaultCommands = {
  '/timeat': timeAt,
  '/timepopularity': timePopularity,
};

export const handleMessage = async (
  message: Message,
  commands = defaultCommands,
) => {
  if (message.text) {
    if (message.text.startsWith('/')) {
      const command = message.text.split(' ');
      if (commands[command[0]]) {
        const textMessage = message.text.replace(command[0], '').trim();
        if (!textMessage) {
          await bot.sendMessage(
            message.chat.id,
            `@${message.from.username}: you need to specify a timezone`,
          );

          return;
        }

        let timezones: string[];

        try {
          timezones = await getTimezones();
        } catch (error) {
          await bot.sendMessage(
            message.chat.id,
            `@${message.from.username}: timezones service is currently unavailable, please try again later`,
          );

          return;
        }

        await commands[command[0]](
          textMessage,
          message.chat,
          message.from,
          timezones,
        );
      }
    }
  }
};
