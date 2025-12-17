import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import fs from 'fs';
import { parseBuffer } from 'music-metadata';

// --- Configuration ---
const SEARCH_DIR = 'public';
const PLAYLIST_OUTPUT_FILE = 'src/playlist.ts';
const TYPES_IMPORT_PATH = 'src/types';

// --- Helpers ---
const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const replaceMeta = (html: string, keyAttr: string, keyValue: string, contentValue: string) => {
  const regex = new RegExp(`<meta[^>]*\\b${keyAttr}=["']${keyValue}["'][^>]*>`, 'i');
  const newTag = `<meta ${keyAttr}="${keyValue}" content="${escapeHtml(contentValue)}">`;
  return html.replace(regex, newTag);
};

const writeHtml = (distDir: string, template: string, filePath: string, title: string, description: string, image: string) => {
  const fullPath = path.join(distDir, filePath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let html = template;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  // Replace Meta Tags
  html = replaceMeta(html, 'name', 'description', description);
  html = replaceMeta(html, 'property', 'og:title', title);
  html = replaceMeta(html, 'property', 'og:description', description);
  html = replaceMeta(html, 'property', 'og:image', image);
  html = replaceMeta(html, 'property', 'twitter:title', title);
  html = replaceMeta(html, 'property', 'twitter:description', description);
  html = replaceMeta(html, 'property', 'twitter:image', image);

  fs.writeFileSync(fullPath, html);
  console.log(`   └─ Generated: ${filePath}`);
};

// --- The Master Plugin ---
function staticSiteGenerator() {
  let albumsCache: any[] = []; // Store data between build steps
  let outDir = 'dist'; // Default, will be updated by config

  return {
    name: 'static-site-generator',
    
    // 1. Capture output directory from config
    configResolved(config: any) {
      outDir = config.build.outDir || 'dist';
    },

    // 2. Scan MP3s and write playlist.ts (Runs BEFORE build)
    async buildStart() {
      console.log('🎵 Scanning public folder for music metadata...');
      const albums: any[] = [];
      const publicPath = path.resolve(__dirname, SEARCH_DIR);

      if (!fs.existsSync(publicPath)) return;

      const folders = fs.readdirSync(publicPath, { withFileTypes: true })
        .filter(d => d.isDirectory()).map(d => d.name);

      for (const folderName of folders) {
        const folderPath = path.join(publicPath, folderName);
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.mp3'));
        
        if (files.length === 0) continue;

        // URL Encode the ID so it matches window.location.pathname segments
        // e.g., "My Album" -> "My%20Album"
        const albumId = encodeURIComponent(folderName);
        
        let albumTitle = folderName;
        let albumArtist = 'Unknown Artist';
        
        // Helper for audio src links (keep strict encoding for file access)
        const encodePath = (str: string) => encodeURIComponent(str);
        
        // Cover path, either webp (if present) or png
        const coverSrc = fs.existsSync(path.join(folderPath, 'Cover.webp')) 
          ? `/${encodePath(folderName)}/Cover.webp` :
          fs.existsSync(path.join(folderPath, 'Cover.png')) 
          ? `/${encodePath(folderName)}/Cover.png` :
          fs.existsSync(path.join(folderPath, 'Cover.jpeg')) 
          ? `/${encodePath(folderName)}/Cover.jpeg`
          : '';

        const tracks: any[] = [];

        for (const fileName of files) {
          try {
            const filePath = path.join(folderPath, fileName);
            const buffer = fs.readFileSync(filePath);
            const metadata = await parseBuffer(buffer, 'audio/mpeg');
            
            const fileNameNoExt = path.parse(fileName).name;
            
            // URL Encode the Track ID as well
            const trackId = encodeURIComponent(fileNameNoExt);
            
            const trackTitle = metadata.common.title || fileNameNoExt;
            const trackArtist = metadata.common.artist;
            const trackAlbum = metadata.common.album;
            
            // Extract track number safely. Default to 0 if missing.
            let trackNo = metadata.common.track?.no ?? 0;

            if (trackArtist && albumArtist === 'Unknown Artist') albumArtist = trackArtist;
            if (trackAlbum && albumTitle === folderName) albumTitle = trackAlbum;

            const encodedFolder = encodePath(folderName);
            
            tracks.push({
              id: trackId, 
              title: trackTitle,
              trackNumber: trackNo,
              audioSrc: `/${encodedFolder}/${encodePath(fileName)}`,
              lrcSrc: `/${encodedFolder}/${encodePath(fileNameNoExt + '.lrc')}`
            });
          } catch (e) { console.error(`Error parsing ${fileName}`, e); }
        }

        // Sort tracks purely by Track Number (Metadata)
        tracks.sort((a, b) => {
          return (a.trackNumber || 0) - (b.trackNumber || 0);
        });

        albums.push({
          id: albumId,
          title: albumTitle,
          artist: albumArtist,
          coverSrc: coverSrc,
          tracks: tracks
        });
      }

      // Sort Albums Alphabetically by Title
      albums.sort((a, b) => a.title.localeCompare(b.title));

      // Save to cache for step 3
      albumsCache = albums;

      // Write TypeScript file
      const content = `import { Album } from '${TYPES_IMPORT_PATH}';\nexport const LIBRARY: Album[] = ${JSON.stringify(albums, null, 2)};`;
      fs.writeFileSync(path.resolve(__dirname, PLAYLIST_OUTPUT_FILE), content);
      console.log(`✅ Playlist generated at ${PLAYLIST_OUTPUT_FILE}`);
    },

    // 3. Generate Static HTML Pages (Runs AFTER build)
    async closeBundle() {
      console.log('📄 Generating static HTML metadata pages...');
      
      const distPath = path.resolve(__dirname, outDir);
      const templatePath = path.join(distPath, 'index.html');

      if (!fs.existsSync(templatePath)) {
        console.warn('⚠️ Dist index.html not found. Skipping static page generation.');
        return;
      }

      const template = fs.readFileSync(templatePath, 'utf-8');

      // Loop through the data we cached in Step 2
      for (const album of albumsCache) {
        const title = album.title;
        const description = `Listen to ${album.artist} - ${album.title} (${album.tracks.length} tracks)`;
        
        // Decode the ID for the file system.
        // If ID is "My%20Album", we write to folder "My Album"
        // The web server will map URL "/My%20Album" -> Disk "My Album"
        const fsAlbumId = decodeURIComponent(album.id);
        
        // 1. Album Page
        writeHtml(distPath, template, `${fsAlbumId}/index.html`, title, description, album.coverSrc);

        // 2. Track Pages
        for (const track of album.tracks) {
          const fsTrackId = decodeURIComponent(track.id);
          const trackDesc = `Listen to ${album.artist} - ${track.title}`;
          writeHtml(distPath, template, `${fsAlbumId}/${fsTrackId}/index.html`, track.title, trackDesc, album.coverSrc);
        }
      }
      console.log('✨ Metadata generation complete.');
    }
  };
}

// Set basepage metadata and title from variables
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const SITE_NAME = env.VITE_SITE_NAME || 'Lyrical Player';
  const SITE_DESC = env.VITE_SITE_DESC || 'Play your collection of tracks synced with lrc files in a neat, web based format.';

  return {
    plugins: [
      react(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          let newHtml = html;
          newHtml = newHtml.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(SITE_NAME)}</title>`);
          newHtml = replaceMeta(newHtml, 'name', 'description', SITE_DESC);
          newHtml = replaceMeta(newHtml, 'property', 'og:title', SITE_NAME);
          newHtml = replaceMeta(newHtml, 'property', 'og:description', SITE_DESC);
          newHtml = replaceMeta(newHtml, 'property', 'twitter:title', SITE_NAME);
          newHtml = replaceMeta(newHtml, 'property', 'twitter:description', SITE_DESC);
          return newHtml;
        }
      },
      staticSiteGenerator()
    ],
    build: {
      target: 'esnext'
    }
  };
});
