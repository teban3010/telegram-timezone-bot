# telegram-timezone-bot

This telegram bot is build using next.js api and deployed to vercel.

An available running version of the bot can be found here
[teban3010_timezone_bot](https://t.me/teban3010_timezone_bot)

The available commands are:

- /timeat - Get time at specified timezone
- /timepopularity - Get the amount of requests to a specified timezone

## Development

Create a new `.env.local` file with the following environment parameters:

```bash
NEXT_PUBLIC_API=https://worldtimeapi.org/api/

TELEGRAM_TOKEN=<TELEGRAM_TOKEN>
NTBA_FIX_319=test

MY_BUCKET_ID=<MY_BUCKET_ID>
```

- TELEGRAM_TOKEN: Is the token provided by `BotFather` to use your bot
  application
- MY_BUCKET_ID: Is the id of your [key/store](https://kvdb.io/) database

Run `npm run dev:all` to start the server and ngrok, you will need to update
your webhook url to use the telegram bot locally.

Update the webhook url by making a curl request to the
[telegram api](https://core.telegram.org/bots/api#setwebhook)
