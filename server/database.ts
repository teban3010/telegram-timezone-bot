// import { getValue, listValues, setValue } from 'lib/database';

import KVdb from 'kvdb.io';

const bucket = KVdb.bucket(process.env.MY_BUCKET_ID);

export const set = async (key: string, value: string) => {
  await bucket.set(key, value);
};

export const get = async (key: string) => await bucket.get(key);

export const increment = async (key: string) => {
  try {
    const currentValue = parseInt(await get(key));

    await set(key, ((isNaN(currentValue) ? 0 : currentValue) + 1).toString());
  } catch (error) {
    await set(key, '1');
  }
};

export const list = async (keyPrefix: string) =>
  await bucket.list({ prefix: keyPrefix, values: true });
