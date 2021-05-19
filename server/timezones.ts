import { API } from 'lib/api';

let timeZones: string[] | undefined;

export const getTimezones = async (): Promise<string[]> => {
  if (!timeZones) {
    timeZones = await API.get('timezone');
  }

  return timeZones;
};
