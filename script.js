
const audio = document.getElementById("audioPlayer");

const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
const favoriteBtn = document.getElementById("favoriteBtn");

const songTitle = document.getElementById("songTitle");
const songArtist = document.getElementById("songArtist");
const albumArt = document.getElementById("albumArt");

const progressBar = document.getElementById("progressBar");
const currentTime = document.getElementById("currentTime");
const durationDisplay = document.getElementById("duration");

const volumeBar = document.getElementById("volumeBar");
const volumeValue = document.getElementById("volumeValue");
const volumeIcon = document.getElementById("volumeIcon");

const playlistList = document.getElementById("playlistList");
const playlistStatus = document.getElementById("playlistStatus");
const trackCount = document.getElementById("trackCount");
const libraryCount = document.getElementById("libraryCount");
const year = document.getElementById("year");

// Replace these sample tracks with your own audio files.
const songs = [
  {
    title: "Midnight Dreams",
    artist: "Afaq's Playlist",
    src: "songs/song1.mp3"
  },
  {
    title: "Neon Skies",
    artist: "Afaq's Playlist",
    src: "songs/song2.mp3"
  },
  {
    title: "Lost in Sound",
    artist: "Afaq's Playlist",
    src: "songs/song3.mp3"
  }
];

let currentIndex = 0;
let isShuffle = false;
let repeatMode = 0; // 0 = off, 1 = repeat one, 2 = repeat all
let isSeeking = false;
let favorites = new Set();

year.textContent = new Date().getFullYear();
trackCount.textContent = `(${songs.length})`;
libraryCount.textContent = `${songs.length} tracks`;

audio.volume = Number(volumeBar.value) / 100;

// Format seconds as minutes:seconds.
function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

// Load a song and update the player interface.
function loadSong(index, autoplay = false) {
  currentIndex = (index + songs.length) % songs.length;

  const song = songs[currentIndex];

  audio.pause();
  audio.src = song.src;
  audio.load();

  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;

  currentTime.textContent = "0:00";
  durationDisplay.textContent = "0:00";
  progressBar.value = 0;

  updateProgressBackground();
  updatePlaylist();
  updateFavoriteButton();

  playlistStatus.textContent = "Ready to play";

  if (autoplay) {
    playSong();
  } else {
    updatePlayButton(false);
  }
}

// Play the current song.
async function playSong() {
  try {
    await audio.play();
  } catch (error) {
    updatePlayButton(false);
    playlistStatus.textContent =
      "Unable to play. Check the audio file path.";
    console.error("Audio playback failed:", error);
  }
}

// Pause the current song.
function pauseSong() {
  audio.pause();
}

// Update the play button and album animation.
function updatePlayButton(isPlaying) {
  playBtn.textContent = isPlaying ? "Ⅱ" : "▶";

  playBtn.setAttribute(
    "aria-label",
    isPlaying ? "Pause music" : "Play music"
  );

  albumArt.classList.toggle("playing", isPlaying);
}

// Play/pause button.
playBtn.addEventListener("click", () => {
  if (audio.paused) {
    playSong();
  } else {
    pauseSong();
  }
});

// Previous song.
prevBtn.addEventListener("click", () => {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }

  loadSong(currentIndex - 1, true);
});

// Next song.
nextBtn.addEventListener("click", () => {
  playNextSong();
});

function playNextSong() {
  if (songs.length <= 1) {
    if (repeatMode === 2) {
      loadSong(currentIndex, true);
    }
    return;
  }

  if (isShuffle) {
    let nextIndex;

    do {
      nextIndex = Math.floor(Math.random() * songs.length);
    } while (nextIndex === currentIndex);

    loadSong(nextIndex, true);
    return;
  }

  if (currentIndex === songs.length - 1 && repeatMode !== 2) {
    // End of playlist: stop when repeat-all is disabled.
    audio.pause();
    audio.currentTime = 0;
    updatePlayButton(false);
    playlistStatus.textContent = "Playlist completed";
    return;
  }

  loadSong(currentIndex + 1, true);
}

// Update the play state when audio starts or pauses.
audio.addEventListener("play", () => {
  updatePlayButton(true);
  playlistStatus.textContent = `Playing: ${songs[currentIndex].title}`;
});

audio.addEventListener("pause", () => {
  updatePlayButton(false);
});

audio.addEventListener("error", () => {
  if (audio.error) {
    playlistStatus.textContent =
      "Audio unavailable. Check your songs folder.";
  }
});

// Update duration after audio metadata loads.
audio.addEventListener("loadedmetadata", () => {
  durationDisplay.textContent = formatTime(audio.duration);

  const durationLabel = playlistList.querySelector(
    `[data-index="${currentIndex}"] .track-duration`
  );

  if (durationLabel) {
    durationLabel.textContent = formatTime(audio.duration);
  }
});

// Update progress while playing.
audio.addEventListener("timeupdate", () => {
  if (isSeeking) return;

  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
    currentTime.textContent = formatTime(audio.currentTime);
    updateProgressBackground();
  }
});

// Seek through the song.
progressBar.addEventListener("input", () => {
  isSeeking = true;

  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    const previewTime = (progressBar.value / 100) * audio.duration;
    currentTime.textContent = formatTime(previewTime);
    updateProgressBackground();
  }
});

progressBar.addEventListener("change", () => {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
  }

  isSeeking = false;
  updateProgressBackground();
});

function updateProgressBackground() {
  const value = Number(progressBar.value);

  progressBar.style.background =
    `linear-gradient(to right, #a78bfa ${value}%, #363140 ${value}%)`;
}

// Volume control.
volumeBar.addEventListener("input", () => {
  audio.volume = Number(volumeBar.value) / 100;

  volumeValue.textContent = `${volumeBar.value}%`;

  volumeIcon.textContent =
    audio.volume === 0 ? "×" : audio.volume < 0.5 ? "◖" : "◗";

  volumeBar.style.background =
    `linear-gradient(to right, #a78bfa ${volumeBar.value}%, #363140 ${volumeBar.value}%)`;
});

// Shuffle toggle.
shuffleBtn.addEventListener("click", () => {
  isShuffle = !isShuffle;

  shuffleBtn.classList.toggle("enabled", isShuffle);
  shuffleBtn.setAttribute("aria-pressed", String(isShuffle));

  playlistStatus.textContent = isShuffle
    ? "Shuffle enabled"
    : "Shuffle disabled";
});

// Repeat modes: off -> repeat one -> repeat all -> off.
repeatBtn.addEventListener("click", () => {
  repeatMode = (repeatMode + 1) % 3;

  repeatBtn.classList.toggle("enabled", repeatMode !== 0);
  repeatBtn.setAttribute("aria-pressed", String(repeatMode !== 0));

  repeatBtn.textContent = repeatMode === 1 ? "↻¹" : "↻";

  playlistStatus.textContent = [
    "Repeat off",
    "Repeating current song",
    "Repeating playlist"
  ][repeatMode];
});

// Automatically play the next track when a song ends.
audio.addEventListener("ended", () => {
  if (repeatMode === 1) {
    audio.currentTime = 0;
    playSong();
  } else {
    playNextSong();
  }
});

// Favorite toggle.
favoriteBtn.addEventListener("click", () => {
  if (favorites.has(currentIndex)) {
    favorites.delete(currentIndex);
  } else {
    favorites.add(currentIndex);
  }

  updateFavoriteButton();
});

function updateFavoriteButton() {
  const isFavorite = favorites.has(currentIndex);

  favoriteBtn.textContent = isFavorite ? "♥" : "♡";
  favoriteBtn.classList.toggle("liked", isFavorite);

  favoriteBtn.setAttribute("aria-pressed", String(isFavorite));
  favoriteBtn.setAttribute(
    "aria-label",
    isFavorite ? "Remove from favorites" : "Add song to favorites"
  );
}

// Playlist selection.
function updatePlaylist() {
  playlistList.querySelectorAll(".track-item").forEach((item, index) => {
    const isSelected = index === currentIndex;

    item.classList.toggle("selected", isSelected);

    if (isSelected) {
      item.setAttribute("aria-current", "true");
    } else {
      item.removeAttribute("aria-current");
    }
  });
}

playlistList.addEventListener("click", (event) => {
  const track = event.target.closest(".track-item");

  if (!track) return;

  const index = Number(track.dataset.index);

  if (!Number.isInteger(index) || !songs[index]) return;

  loadSong(index, true);
});

// Initialize the first song.
loadSong(0);

volumeBar.dispatchEvent(new Event("input"));
