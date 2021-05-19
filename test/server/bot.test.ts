process.env.TELEGRAM_TOKEN = 'TELEGRAM_TOKEN';

import { Chat, User } from 'node-telegram-bot-api';
import { handleMessage, timeAt, timePopularity } from 'server/bot';

import { API } from 'lib/api';

import bot from 'lib/bot';
import { increment, list } from 'server/database';
import { getTimezones } from 'server/timezones';

jest.mock('server/database');
jest.mock('server/timezones');

const mockIncrement = <jest.MockedFunction<typeof increment>>increment;
const mockList = <jest.MockedFunction<typeof list>>list;

const mockGetTimezones = <jest.MockedFunction<typeof getTimezones>>getTimezones;
const mockGet = jest.fn();
const mockSendMessage = jest.fn();

beforeAll(() => {
  jest.spyOn(API, 'get').mockImplementation(mockGet);
  jest.spyOn(bot, 'sendMessage').mockImplementation(mockSendMessage);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('handleMessage', () => {
  const mockTestCommand = jest.fn();

  const commands = {
    '/test': mockTestCommand,
    '/timeat': jest.fn(),
    '/timepopularity': jest.fn(),
  };

  test('It should handle a command message', async () => {
    mockGetTimezones.mockReturnValue(Promise.resolve(['America']));

    await handleMessage(
      {
        message_id: 1234,
        chat: { id: 5678, type: 'channel' },
        date: 123456789,
        text: '/test test',
        from: { id: 3456, username: 'test', is_bot: false, first_name: 'test' },
      },
      commands,
    );

    expect(mockGetTimezones).toHaveBeenCalledTimes(1);

    expect(commands['/test']).toHaveBeenCalledTimes(1);
    expect(commands['/test']).toHaveBeenCalledWith(
      'test',
      { id: 5678, type: 'channel' },
      { id: 3456, username: 'test', is_bot: false, first_name: 'test' },
      ['America'],
    );

    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(commands['/timeat']).not.toHaveBeenCalled();
    expect(commands['/timepopularity']).not.toHaveBeenCalled();
  });

  test('It should not handle a command without message', async () => {
    await handleMessage(
      {
        message_id: 1234,
        chat: { id: 5678, type: 'channel' },
        date: 123456789,
        text: '/test',
        from: { id: 3456, username: 'test', is_bot: false, first_name: 'test' },
      },
      commands,
    );
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      5678,
      `@test: you need to specify a timezone`,
    );

    expect(mockGetTimezones).not.toHaveBeenCalled();
    expect(commands['/timeat']).not.toHaveBeenCalled();
    expect(commands['/timeat']).not.toHaveBeenCalled();
    expect(commands['/timepopularity']).not.toHaveBeenCalled();
  });

  test('It should return an error message if the timezone service is unavailable', async () => {
    mockGetTimezones.mockRejectedValue(Promise.reject());

    await handleMessage(
      {
        message_id: 1234,
        chat: { id: 5678, type: 'channel' },
        date: 123456789,
        text: '/test test',
        from: { id: 3456, username: 'test', is_bot: false, first_name: 'test' },
      },
      commands,
    );

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      5678,
      `@test: timezones service is currently unavailable, please try again later`,
    );

    expect(mockGetTimezones).toHaveBeenCalledTimes(1);

    expect(commands['/timeat']).not.toHaveBeenCalled();
    expect(commands['/timeat']).not.toHaveBeenCalled();
    expect(commands['/timepopularity']).not.toHaveBeenCalled();
  });

  test('It should not handle an unknown command message', async () => {
    await handleMessage({
      message_id: 1234,
      chat: { id: 5678, type: 'channel' },
      date: 123456789,
      text: '/unknown test',
      from: { id: 3456, username: 'test', is_bot: false, first_name: 'test' },
    });

    expect(mockGetTimezones).not.toHaveBeenCalled();
  });

  test('It should not handle a common message', async () => {
    await handleMessage(
      {
        message_id: 1234,
        chat: { id: 5678, type: 'channel' },
        date: 123456789,
        text: 'test',
        from: { id: 3456, username: 'test', is_bot: false, first_name: 'test' },
      },
      commands,
    );

    expect(mockGetTimezones).not.toHaveBeenCalled();
    expect(commands['/test']).not.toHaveBeenCalled();
    expect(commands['/timeat']).not.toHaveBeenCalled();
    expect(commands['/timepopularity']).not.toHaveBeenCalled();
  });

  test('It should not handle message that does not contains text', async () => {
    await handleMessage(
      {
        message_id: 1234,
        chat: { id: 5678, type: 'channel' },
        date: 123456789,
        from: { id: 3456, username: 'test', is_bot: false, first_name: 'test' },
      },
      commands,
    );

    expect(mockGetTimezones).not.toHaveBeenCalled();
    expect(commands['/test']).not.toHaveBeenCalled();
    expect(commands['/timeat']).not.toHaveBeenCalled();
    expect(commands['/timepopularity']).not.toHaveBeenCalled();
  });
});

describe('timeAt', () => {
  const chat: Chat = { id: 5678, type: 'channel' };
  const user: User = {
    id: 3456,
    username: 'test',
    is_bot: false,
    first_name: 'test',
  };

  test('It should return the required timezone', async () => {
    mockGet.mockReturnValue({
      abbreviation: 'GMT',
      datetime: '2021-05-19T14:25:14.654676+00:00',
      timezone: 'America',
    });

    await timeAt('America', chat, user, ['America']);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('timezone/America');

    expect(mockIncrement).toHaveBeenCalledTimes(2);
    expect(mockIncrement).toHaveBeenNthCalledWith(1, 'America');
    expect(mockIncrement).toHaveBeenNthCalledWith(2, 'GMT');

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      5678,
      '@test: America timeat is 19 May 2021 14:25',
    );
  });

  test('It should return an error message if the timezone service is unavailable', async () => {
    mockGet.mockReturnValue(Promise.reject());

    await timeAt('America', chat, user, ['America']);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('timezone/America');

    expect(mockIncrement).not.toHaveBeenCalled();

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      5678,
      `@test: timezones service is currently unavailable, please try again later`,
    );
  });

  test('It should return the required timezone', async () => {
    mockGet.mockReturnValue({
      abbreviation: 'GMT',
      datetime: '2021-05-19T14:25:14.654676+00:00',
      timezone: 'America',
    });

    await timeAt('America', chat, user, ['America']);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('timezone/America');

    expect(mockIncrement).toHaveBeenCalledTimes(2);
    expect(mockIncrement).toHaveBeenNthCalledWith(1, 'America');
    expect(mockIncrement).toHaveBeenNthCalledWith(2, 'GMT');

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      5678,
      '@test: America timeat is 19 May 2021 14:25',
    );
  });

  test('It should return the required timezone even for an incomplete one', async () => {
    mockGet.mockReturnValue({
      abbreviation: 'GMT',
      datetime: '2021-05-19T14:25:14.654676+00:00',
      timezone: 'America/California',
    });

    await timeAt('California', chat, user, ['America/California']);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('timezone/America/California');

    expect(mockIncrement).toHaveBeenCalledTimes(2);
    expect(mockIncrement).toHaveBeenNthCalledWith(1, 'America/California');
    expect(mockIncrement).toHaveBeenNthCalledWith(2, 'GMT');

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      5678,
      '@test: California timeat is 19 May 2021 14:25',
    );
  });

  test('It should return unknown if the required timezone is not a valid timezone', async () => {
    await timeAt('California', chat, user, ['America']);

    expect(mockGet).not.toHaveBeenCalled();
    expect(mockIncrement).not.toHaveBeenCalled();

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      5678,
      '@test: unknown timezone California',
    );
  });

  test('It should return unknown if the required timezone matches more than one valid timezone', async () => {
    await timeAt('America', chat, user, ['America/Bogota', 'America/Boise']);

    expect(mockGet).not.toHaveBeenCalled();
    expect(mockIncrement).not.toHaveBeenCalled();

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      5678,
      '@test: unknown timezone America',
    );
  });
});

describe('timePopularity', () => {
  const chat: Chat = { id: 5678, type: 'channel' };
  const user: User = {
    id: 3456,
    username: 'test',
    is_bot: false,
    first_name: 'test',
  };

  test('It should return the time popularity of the required timezone', async () => {
    mockList.mockReturnValue(
      Promise.resolve([
        ['America/Bogota', '5'],
        ['America/Boise', '2'],
      ]),
    );

    await timePopularity('America', chat, user, [
      'America/Bogota',
      'America/Boise',
    ]);

    expect(mockList).toHaveBeenCalledTimes(1);
    expect(mockList).toHaveBeenCalledWith('America');

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      5678,
      `@test: America have been called 7 times`,
    );
  });

  test("It should return the time popularity of the required timezone when it's not a prefix", async () => {
    mockList.mockReturnValue(Promise.resolve([['America/Bogota', '5']]));

    await timePopularity('Bogota', chat, user, [
      'America/Bogota',
      'America/Boise',
    ]);

    expect(mockList).toHaveBeenCalledTimes(1);
    expect(mockList).toHaveBeenCalledWith('America/Bogota');

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      5678,
      `@test: Bogota have been called 5 times`,
    );
  });

  test('It should return the time popularity of the required timezone although is not on the timezone list', async () => {
    mockList.mockReturnValue(Promise.resolve([['GTM', '5']]));

    await timePopularity('GTM', chat, user, [
      'America/Bogota',
      'America/Boise',
    ]);

    expect(mockList).toHaveBeenCalledTimes(1);
    expect(mockList).toHaveBeenCalledWith('GTM');

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      5678,
      `@test: GTM have been called 5 times`,
    );
  });
});
