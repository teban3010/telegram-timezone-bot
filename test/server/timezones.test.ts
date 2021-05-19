import { API } from 'lib/api';
import { getTimezones } from 'server/timezones';

const mockGet = jest.fn();

beforeAll(() => {
  jest.spyOn(API, 'get').mockImplementation(mockGet);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('getTimezones', () => {
  test('It should get the timezones from the API once and the stored one the second time', async () => {
    mockGet.mockReturnValue(['America']);

    const resultFirstCall = await getTimezones();
    const resultSecondCall = await getTimezones();

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('timezone');

    expect(resultFirstCall).toBe(resultSecondCall);
    expect(resultFirstCall).toStrictEqual(['America']);
    expect(resultSecondCall).toStrictEqual(['America']);
  });
});
