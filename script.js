/* =========================================
   MUSIC
========================================= */

const music =
    document.getElementById("music");

const playButton =
    document.getElementById("play-button");

const currentTime =
    document.getElementById("current-time");

const duration =
    document.getElementById("duration");

const progress =
    document.getElementById("progress");

const progressBar =
    document.getElementById("progress-bar");

const albumCover =
    document.getElementById("album-cover");

const songTitle =
    document.getElementById("song-title");

const songArtist =
    document.getElementById("song-artist");

const visualizer =
    document.getElementById("visualizer");

/* NEW - LYRIC */

const musicLyric =
    document.getElementById("music-lyric");

    const previousLyric =
    document.getElementById(
        "previous-lyric"
    );


const nextLyric =
    document.getElementById(
        "next-lyric"
    );


let currentLyricIndex = -1;

let currentLyrics = [];



/* =========================================
   PLAYLIST
========================================= */

const playlist = [

    {
        title: "Apocalypse",
        artist: "Cigarettes After Sex",
        audio: "apocal.mp3",
        cover: "cgr.jpg",

        /* NEW */
        lyrics: "apocal.lrc"
    },

    {
        title: "Let Down",
        artist: "Radiohead",
        audio: "letdown.mp3",
        cover: "ltdn.jpg",

        /* NEW */
        lyrics: "ltdn.lrc"
    },

    {
        title: "Song Three",
        artist: "Unknown Artist",
        audio: "song3.mp3",
        cover: "song3.jpg",

        /* change this when you have it */
        lyrics: "song3.lrc"
    }

];


let currentSong = 0;



/* =========================================
   TIME
========================================= */

function formatTime(time) {

    if (isNaN(time)) {
        return "0:00";
    }


    const minutes =
        Math.floor(time / 60);


    let seconds =
        Math.floor(time % 60);


    if (seconds < 10) {

        seconds =
            "0" + seconds;
    }


    return minutes + ":" + seconds;
}



/* =========================================
   READ LRC FILE
========================================= */

function parseLRC(text) {

    const lyrics = [];


    const lines =
        text.split(/\r?\n/);


    for (const line of lines) {

        /*
        Accepts:

        [00:12.50] lyric
        [00:12.500] lyric
        [00:12] lyric
        */

        const match =
            line.match(
                /\[(\d{1,3}):(\d{1,2}(?:\.\d{1,3})?)\](.*)/
            );


        if (!match) {

            continue;
        }


        const minutes =
            Number(match[1]);


        const seconds =
            Number(match[2]);


        const text =
            match[3].trim();


        if (text === "") {

            continue;
        }


        lyrics.push({

            time:
                (minutes * 60) +
                seconds,

            text:
                text

        });

    }


    /* make sure timestamps are ordered */

    lyrics.sort(
        function (a, b) {

            return a.time - b.time;

        }
    );


    return lyrics;
}



/* =========================================
   LOAD LYRICS
========================================= */

async function loadLyrics(file) {

    currentLyrics = [];
    currentLyricIndex = -1;

    if (!musicLyric) {

        console.error(
            'Missing HTML element: id="music-lyric"'
        );

        return;
    }


    musicLyric.textContent =
        "loading lyrics...";


    try {

        const response =
            await fetch(file);


        if (!response.ok) {

            throw new Error(
                "Could not find " + file
            );

        }


        const text =
            await response.text();


        currentLyrics =
            parseLRC(text);


        console.log(
            "Loaded lyrics:",
            file,
            currentLyrics
        );


        if (
            currentLyrics.length === 0
        ) {

            musicLyric.textContent =
                "no synced lyrics found";

        }

        else {

            musicLyric.textContent =
                "...";

        }

    }

    catch (error) {

        console.error(
            "LYRIC ERROR:",
            error
        );


        musicLyric.textContent =
            "lyrics unavailable";

    }

}



/* =========================================
   CHANGE LYRIC
========================================= */

function updateLyrics() {

    if (
        currentLyrics.length === 0
    ) {

        return;
    }


    let activeIndex = -1;


    /* FIND CURRENT LYRIC */

    for (
        let i = 0;
        i < currentLyrics.length;
        i++
    ) {

        if (
            music.currentTime >=
            currentLyrics[i].time
        ) {

            activeIndex = i;

        }

        else {

            break;

        }

    }


    /* BEFORE FIRST LYRIC */

    if (activeIndex === -1) {

        previousLyric.textContent =
            "";


        musicLyric.textContent =
            "...";


        nextLyric.textContent =
            currentLyrics[0].text;


        return;
    }


    /*
    Don't redraw everything constantly.
    Only update when lyric changes.
    */

    if (
        activeIndex ===
        currentLyricIndex
    ) {

        return;
    }


    currentLyricIndex =
        activeIndex;



    /* PREVIOUS LYRIC */

    if (
        activeIndex > 0
    ) {

        previousLyric.textContent =
            currentLyrics[
                activeIndex - 1
            ].text;

    }

    else {

        previousLyric.textContent =
            "";

    }



    /* CURRENT LYRIC */

    musicLyric.textContent =
        currentLyrics[
            activeIndex
        ].text;



    /* NEXT LYRIC */

    if (
        activeIndex <
        currentLyrics.length - 1
    ) {

        nextLyric.textContent =
            currentLyrics[
                activeIndex + 1
            ].text;

    }

    else {

        nextLyric.textContent =
            "";

    }



    /* RESTART ANIMATION */

    musicLyric.classList.remove(
        "lyric-change"
    );


    void musicLyric.offsetWidth;


    musicLyric.classList.add(
        "lyric-change"
    );

}



/* =========================================
   LOAD SONG
========================================= */

function loadSong(index) {

    if (
        index < 0 ||
        index >= playlist.length
    ) {

        return false;
    }


    currentSong = index;


    const song =
        playlist[currentSong];


    /* SONG INFO */

    songTitle.textContent =
        song.title;


    songArtist.textContent =
        song.artist;


    albumCover.src =
        song.cover;



    /* AUDIO */

    music.src =
        song.audio;


    music.load();



    /* NEW - LOAD LRC */

    loadLyrics(
        song.lyrics
    );



    /* RESET */

    currentTime.textContent =
        "0:00";


    duration.textContent =
        "0:00";


    progressBar.style.width =
        "0%";


    /* PLAY */

    music.play().catch(
        function () {

            console.log(
                "Autoplay blocked by browser."
            );

        }
    );


    return true;
}



/* =========================================
   MUSIC EVENTS
========================================= */

music.addEventListener(
    "loadedmetadata",
    function () {

        duration.textContent =
            formatTime(
                music.duration
            );

    }
);



/* =========================================
   UPDATE MUSIC
========================================= */

music.addEventListener(
    "timeupdate",
    function () {

        /* TIME */

        currentTime.textContent =
            formatTime(
                music.currentTime
            );


        /* PROGRESS */

        if (!isNaN(music.duration)) {

            const percent =
                (
                    music.currentTime /
                    music.duration
                ) * 100;


            progressBar.style.width =
                percent + "%";

        }


        /* LYRICS */

        updateLyrics();

    }
);



/* =========================================
   PLAY BUTTON
========================================= */

playButton.addEventListener(
    "click",
    function () {

        if (music.paused) {

            music.play();

        }

        else {

            music.pause();

        }

    }
);



/* =========================================
   MUSIC PLAYING
========================================= */

music.addEventListener(
    "play",
    function () {

        playButton.innerHTML =
            '<i class="fa-solid fa-pause"></i>';


        if (visualizer) {

            visualizer.classList.add(
                "playing"
            );

        }

    }
);



/* =========================================
   MUSIC PAUSED
========================================= */

music.addEventListener(
    "pause",
    function () {

        playButton.innerHTML =
            '<i class="fa-solid fa-play"></i>';


        if (visualizer) {

            visualizer.classList.remove(
                "playing"
            );

        }

    }
);



/* =========================================
   PROGRESS BAR
========================================= */

progress.addEventListener(
    "click",
    function (event) {

        if (isNaN(music.duration)) {

            return;
        }


        const box =
            progress.getBoundingClientRect();


        const clickPosition =
            event.clientX - box.left;


        let percent =
            clickPosition / box.width;


        percent =
            Math.max(
                0,
                Math.min(
                    1,
                    percent
                )
            );


        music.currentTime =
            percent *
            music.duration;


        /*
        Update lyric immediately
        after clicking progress bar.
        */

        updateLyrics();

    }
);



/* =========================================
   NEXT / PREVIOUS
========================================= */

function nextSong() {

    currentSong++;


    if (
        currentSong >=
        playlist.length
    ) {

        currentSong = 0;
    }


    loadSong(
        currentSong
    );
}



function previousSong() {

    currentSong--;


    if (currentSong < 0) {

        currentSong =
            playlist.length - 1;
    }


    loadSong(
        currentSong
    );
}



/* =========================================
   TERMINAL
========================================= */

const terminalInput =
    document.getElementById(
        "terminal-input"
    );


const terminalOutput =
    document.getElementById(
        "terminal-output"
    );


const terminalScreen =
    document.getElementById(
        "terminal-screen"
    );


const inputLine =
    document.getElementById(
        "input-line"
    );



/* =========================================
   QUOTES
========================================= */

const quotes = [

    "there is nothing but void...",

    "silence is also an answer.",

    "we are all temporary.",

    "the night knows things the morning forgets.",

    "somewhere between nowhere and nothing.",

    "everything eventually becomes a memory.",

    "such is life.",

    "existing is weird. anyway...",

    "maybe getting lost is part of finding something.",

    "the void is staring back."

];



/* =========================================
   SLEEP
========================================= */

function sleep(ms) {

    return new Promise(
        function (resolve) {

            setTimeout(
                resolve,
                ms
            );

        }
    );
}



/* =========================================
   TYPING
========================================= */

async function typeText(
    element,
    text,
    speed = 35
) {

    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        element.textContent +=
            text[i];


        terminalScreen.scrollTop =
            terminalScreen.scrollHeight;


        await sleep(
            speed +
            Math.random() * 35
        );

    }
}



/* =========================================
   NEW TERMINAL LINE
========================================= */

function newLine(
    className = ""
) {

    const line =
        document.createElement(
            "div"
        );


    line.className =
        "terminal-line " +
        className;


    terminalOutput.appendChild(
        line
    );


    terminalScreen.scrollTop =
        terminalScreen.scrollHeight;


    return line;
}



/* =========================================
   STARTUP
========================================= */

async function startTerminal() {

    inputLine.style.display =
        "none";


    let line;



    line =
        newLine(
            "system-text"
        );


    await typeText(
        line,
        "initializing void...",
        30
    );


    await sleep(350);



    line =
        newLine(
            "system-text"
        );


    await typeText(
        line,
        "loading xwkx0xklsj105xz0105...",
        25
    );


    await sleep(400);



    /* AUTOMATIC QUOTE */

    line =
        newLine();


    line.innerHTML =
        '<span class="terminal-prompt">' +
        'void@rene:~$</span> ';


    const autoCommand =
        document.createElement(
            "span"
        );


    line.appendChild(
        autoCommand
    );


    await typeText(
        autoCommand,
        "quote",
        70
    );


    await sleep(250);



    const randomQuote =
        quotes[
            Math.floor(
                Math.random() *
                quotes.length
            )
        ];


    line =
        newLine(
            "quote-text"
        );


    await typeText(
        line,
        '"' +
        randomQuote +
        '"',
        25
    );


    await sleep(350);



    line =
        newLine(
            "system-text"
        );


    await typeText(
        line,
        'type "help" for commands.',
        20
    );


    await sleep(200);


    inputLine.style.display =
        "flex";


    terminalInput.focus();
}



/* =========================================
   SHOW MUSIC LIST
========================================= */

async function showMusicList() {

    let line =
        newLine(
            "system-text"
        );


    await typeText(
        line,
        "available tracks:",
        20
    );


    for (
        let i = 0;
        i < playlist.length;
        i++
    ) {

        const song =
            playlist[i];


        line =
            newLine(
                "music-list"
            );


        await typeText(

            line,

            (i + 1) +
            ". " +
            song.title +
            " — " +
            song.artist,

            10

        );

    }


    line =
        newLine(
            "system-text"
        );


    await typeText(
        line,
        'use "music 1", "music 2", etc.',
        15
    );
}



/* =========================================
   COMMANDS
========================================= */

terminalInput.addEventListener(
    "keydown",

    async function (event) {

        if (
            event.key !== "Enter"
        ) {

            return;
        }


        const command =
            terminalInput.value
                .trim()
                .toLowerCase();


        if (command === "") {

            return;
        }



        /* SHOW ENTERED COMMAND */

        const commandLine =
            newLine();


        const prompt =
            document.createElement(
                "span"
            );


        prompt.className =
            "terminal-prompt";


        prompt.textContent =
            "void@rene:~$";


        commandLine.appendChild(
            prompt
        );


        commandLine.appendChild(
            document.createTextNode(
                " " + command
            )
        );


        terminalInput.value =
            "";



        /* QUOTE */

        if (
            command === "quote"
        ) {

            const randomQuote =
                quotes[
                    Math.floor(
                        Math.random() *
                        quotes.length
                    )
                ];


            const line =
                newLine(
                    "quote-text"
                );


            await typeText(
                line,
                '"' +
                randomQuote +
                '"',
                25
            );

        }



        /* HELP */

        else if (
            command === "help"
        ) {

            const line =
                newLine(
                    "system-text"
                );


            await typeText(
                line,
                "commands: quote | music | next | prev | pause | play | now | about | clear",
                10
            );

        }



        /* MUSIC LIST */

        else if (
            command === "music"
        ) {

            await showMusicList();

        }



        /* MUSIC NUMBER */

        else if (
            command.startsWith(
                "music "
            )
        ) {

            const number =
                parseInt(
                    command.split(
                        " "
                    )[1]
                );


            if (
                !isNaN(number) &&
                number >= 1 &&
                number <=
                playlist.length
            ) {

                const song =
                    playlist[
                        number - 1
                    ];


                let line =
                    newLine(
                        "system-text"
                    );


                await typeText(
                    line,
                    "switching track...",
                    20
                );


                loadSong(
                    number - 1
                );


                line =
                    newLine(
                        "quote-text"
                    );


                await typeText(
                    line,

                    "now playing: " +
                    song.title +
                    " — " +
                    song.artist,

                    12
                );

            }

            else {

                const line =
                    newLine(
                        "error-text"
                    );


                await typeText(
                    line,
                    "track not found.",
                    20
                );

            }

        }



        /* NEXT */

        else if (
            command === "next"
        ) {

            nextSong();


            const song =
                playlist[
                    currentSong
                ];


            const line =
                newLine(
                    "quote-text"
                );


            await typeText(
                line,

                "now playing: " +
                song.title +
                " — " +
                song.artist,

                12
            );

        }



        /* PREVIOUS */

        else if (
            command === "prev"
        ) {

            previousSong();


            const song =
                playlist[
                    currentSong
                ];


            const line =
                newLine(
                    "quote-text"
                );


            await typeText(
                line,

                "now playing: " +
                song.title +
                " — " +
                song.artist,

                12
            );

        }



        /* PAUSE */

        else if (
            command === "pause"
        ) {

            music.pause();


            const line =
                newLine(
                    "system-text"
                );


            await typeText(
                line,
                "music paused.",
                20
            );

        }



        /* PLAY */

        else if (
            command === "play"
        ) {

            music.play();


            const line =
                newLine(
                    "system-text"
                );


            await typeText(
                line,
                "resuming playback...",
                20
            );

        }



        /* NOW PLAYING */

        else if (
            command === "now"
        ) {

            const song =
                playlist[
                    currentSong
                ];


            const line =
                newLine(
                    "quote-text"
                );


            await typeText(
                line,

                "now playing: " +
                song.title +
                " — " +
                song.artist,

                12
            );

        }



        /* ABOUT */

        else if (
            command === "about"
        ) {

            const line =
                newLine(
                    "system-text"
                );


            await typeText(
                line,
                "just a student wandering around the void.",
                20
            );

        }



        /* CLEAR */

        else if (
            command === "clear"
        ) {

            terminalOutput.innerHTML =
                "";

        }



        /* UNKNOWN */

        else {

            const line =
                newLine(
                    "error-text"
                );


            await typeText(

                line,

                "bash: " +
                command +
                ": command not found",

                15
            );

        }


        terminalScreen.scrollTop =
            terminalScreen.scrollHeight;


        terminalInput.focus();

    }
);



/* =========================================
   CLICK TERMINAL = FOCUS INPUT
========================================= */

terminalScreen.addEventListener(
    "click",
    function () {

        terminalInput.focus();

    }
);



/* =========================================
   START
========================================= */

/*
IMPORTANT:

Your HTML already begins with Apocalypse,
so we manually load Apocalypse's LRC here.
*/

loadLyrics(
    playlist[currentSong].lyrics
);


startTerminal();

const terminalSection =
    document.querySelector(
        ".terminal-section"
    );


const terminalMinimize =
    document.getElementById(
        "terminal-minimize"
    );


terminalMinimize.addEventListener(
    "click",
    function () {

        terminalSection.classList.toggle(
            "minimized"
        );


        if (
            terminalSection.classList.contains(
                "minimized"
            )
        ) {

            terminalMinimize.textContent =
                "+";

        }

        else {

            terminalMinimize.textContent =
                "_";


            terminalInput.focus();

        }

    }
);