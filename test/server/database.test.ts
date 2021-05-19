export {};

const mockGetValue = jest.fn();
const mockSetValue = jest.fn();
const mockListValues = jest.fn();

const mockBucket = jest.fn(() => ({
  get: mockGetValue,
  set: mockSetValue,
  list: mockListValues,
}));

beforeAll(() => {
  jest.mock('kvdb.io', () => ({
    bucket: mockBucket,
  }));
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('set', () => {
  let set;

  beforeEach(() => {
    set = require('server/database').set;
  });

  test('It should set a new record', async () => {
    await set('America', '5');

    expect(mockSetValue).toHaveBeenCalledTimes(1);
    expect(mockSetValue).toHaveBeenCalledWith('America', '5');
  });
});

describe('get', () => {
  let get;

  beforeEach(() => {
    get = require('server/database').get;
  });

  test('It should return the value from the database', async () => {
    mockGetValue.mockReturnValue('5');

    const result = await get('America');

    expect(mockGetValue).toHaveBeenCalledTimes(1);
    expect(mockGetValue).toHaveBeenCalledWith('America');

    expect(result).toBe('5');
  });
});

describe('increment', () => {
  let increment;

  beforeEach(() => {
    increment = require('server/database').increment;
  });

  test('It should increment the value of the given key by one', async () => {
    mockGetValue.mockReturnValue('5');

    await increment('America');

    expect(mockGetValue).toHaveBeenCalledTimes(1);
    expect(mockGetValue).toHaveBeenCalledWith('America');

    expect(mockSetValue).toHaveBeenCalledTimes(1);
    expect(mockSetValue).toHaveBeenCalledWith('America', '6');
  });

  test('It should create a new record with and assign 1 to it if it does not exists', async () => {
    mockGetValue.mockReturnValue(null);

    await increment('America');

    expect(mockGetValue).toHaveBeenCalledTimes(1);
    expect(mockGetValue).toHaveBeenCalledWith('America');

    expect(mockSetValue).toHaveBeenCalledTimes(1);
    expect(mockSetValue).toHaveBeenCalledWith('America', '1');
  });

  test('It should create a new record with and assign 1 to it if get fails', async () => {
    mockGetValue.mockReturnValue(Promise.reject());

    await increment('America');

    expect(mockGetValue).toHaveBeenCalledTimes(1);
    expect(mockGetValue).toHaveBeenCalledWith('America');

    expect(mockSetValue).toHaveBeenCalledTimes(1);
    expect(mockSetValue).toHaveBeenCalledWith('America', '1');
  });
});

describe('list', () => {
  let list;

  beforeEach(() => {
    list = require('server/database').list;
  });

  test('It should return the list of values for the given prefix', async () => {
    mockListValues.mockReturnValue([
      ['America/Bogota', '5'],
      ['America/Boise', '2'],
    ]);

    const result = await list('America');

    expect(mockListValues).toHaveBeenCalledTimes(1);
    expect(mockListValues).toHaveBeenCalledWith({
      prefix: 'America',
      values: true,
    });

    expect(result).toStrictEqual([
      ['America/Bogota', '5'],
      ['America/Boise', '2'],
    ]);
  });
});
