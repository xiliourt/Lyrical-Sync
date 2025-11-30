# Lyrical Sync 
## Features
- Synced timed lyrics (lrc) with mp3 files in a simple browser application
- Auto generate album tiles, track lists (ordered), linkable album and track pages (including metadata), etc.
- Pulls track information from mp3 file metadata
  - Requires mp3 files with matching named lrc files. For example Track.mp3 and Track.lrc.
- State persistence scrolling between pages / albums

## Deploy with Vercel (One Click Deployment)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxiliourt%2FLyrical-Sync)

- Deploy to Vercel
- Add your mp3 and lrc files to /public/(subdirectories) with matching names
  - For example track.mp3 and track.lrc
  - MP3 file must have accurate metadata for best functionality

## Structure:
- Public
  - (subdir)
    - Song.mp3
    - Song.lrc

## Fork Repo (Multi step Deployment)
Feel free to fork the repo inside - this way any updates you can merge into your deployments, while keeping your collection. You'll need to manually deploy the git to Vercel, Cloudflare pages or elsewhere with this method, though can merge updates easily if I maintain this further.


## Creating lrc files
https://lrcgen.xiliourt.ovh/ Feel free to generate lyrics here - simply generate a free API key in aistudio (only uses flash). Enter the API key, upload your audio file(s), enter generic lyrics (non-timed) if available, and let Gemini do its magic. 

The code is customised to tell the model to prioritise entered lyrics unless absolutely certain the tracks lyrics differ, so lyrics are usually highly accurate. Timing can be a few seconds off. I typically manually fix them after using. https://seinopsys.dev/lrc after


### Credits
Song used is https://www.youtube.com/watch?v=24C8r8JupYY (copyright free)



# Note: ToS / Fair Use / Rate Limits (Cloudflare / Vercel)
Vercel and Cloudflare may dislike you using static sites to serve music. I recommend keeping things to 128kbps, a few MB every few minutes won't flag much.

For large deployments you will need to implement alternative storage solutions.
