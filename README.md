# Multi-agent Meeting Example using local LiveKit server:

There's a bunch of instructions here, but it's all fairly straightforward. The agents are slightly modified from the [fast agent example](https://github.com/dsa/fast-voice-assistant/) to explicitly have separate names and run on different ports. This will be more automated in a future release, but for now the tweaks are to get things to work.

## Run LiveKit server
These commands will install [LiveKit server](https://github.com/livekit/livekit) on your machine and run it in dev mode. Dev mode uses a specific API key and secret pair.
1. `brew install livekit`
2. `livekit-server -dev`

## Run LiveKit Meet
Usually you'd run the agent(s) first and then start a session and the agent(s) would automatically join. Turns out that isn't how it works for multi-agent at the moment. So what we're going to do is have the human join the meeting first, and then explicitly have the agents join the room.
1. `cd meet`
2. `pnpm i`
3. `cp .env.example .env.local`
4. `pnpm dev`
5. open `localhost:3000` in a browser and click 'Start Meeting'
6. note the room name in your browser address bar: `http://localhost:3000/rooms/<room-name>`

## Run first agent
1. `cd agent-1`
2. `python -m venv .venv`
3. `source .venv/bin/activate`
4. `pip install -r requirements.txt`
5. `cp .env.example .env`
6. add values for keys in `.env`
7. `python main.py connect --room <room-name>`

## Run second agent
1. `cd agent-2`
2. `python -m venv .venv`
3. `source .venv/bin/activate`
4. `pip install -r requirements.txt`
5. `cp ../agent-1/.env .`
7. `python main.py connect --room <room-name>`

