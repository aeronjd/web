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
        resolve => setTimeout(resolve, ms)
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

        else if (command === "void") {
    runVoidEvent();
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
// =========================
// SECRET VOID EVENT
// =========================
// =========================
// SECRET VOID EVENTS
// =========================

let voidCount = 0;
let voidRunning = false;


async function runVoidEvent() {

    if (voidRunning) return;

    voidRunning = true;
    voidCount++;

    let eventNumber = voidCount;

    // After 5 uses, randomly choose an event
    if (eventNumber > 5) {
        eventNumber =
            Math.floor(Math.random() * 5) + 1;
    }


    if (eventNumber === 1) {
        await voidSignalLost();
    }

    else if (eventNumber === 2) {
        await voidCorruption();
    }

    else if (eventNumber === 3) {
        await voidBlackout();
    }

    else if (eventNumber === 4) {
        await voidCrash();
    }

    else if (eventNumber === 5) {
        await voidRemember();
    }


    voidRunning = false;

    terminalScreen.scrollTop =
        terminalScreen.scrollHeight;

    terminalInput.focus();
}


/* =========================
   VOID #1
   SIGNAL LOST
========================= */

async function voidSignalLost() {

    let line =
        newLine("system-text");

    await typeText(
        line,
        "accessing /dev/void...",
        25
    );

    await sleep(300);


    line =
        newLine("error-text");

    await typeText(
        line,
        "signal lost.",
        30
    );

    await sleep(200);


    document.body.classList.add(
        "void-event"
    );


    const warning =
        createVoidWarning(
            "SIGNAL LOST"
        );


    await sleep(700);

    warning.textContent =
        "ERR_0x000VOID";


    await sleep(700);

    warning.textContent =
        "RECONNECTING...";


    await sleep(700);


    document.body.classList.remove(
        "void-event"
    );

    warning.remove();


    line =
        newLine("system-text");

    await typeText(
        line,
        "connection restored.",
        25
    );
}


/* =========================
   VOID #2
   CORRUPTION
========================= */

async function voidCorruption() {

    let line =
        newLine("error-text");


    await typeText(
        line,
        "something followed you back.",
        30
    );


    await sleep(300);


    document.body.classList.add(
        "void-corruption"
    );


    const warning =
        createVoidWarning(
            "C0RRUPT10N"
        );


    const messages = [
        "C0RRUPT10N",
        "V0ID://ERROR",
        "##@!01XZ",
        "MEMORY???",
        "D0_N0T_L00K"
    ];


    for (let i = 0; i < 12; i++) {

        warning.textContent =
            messages[
                Math.floor(
                    Math.random() *
                    messages.length
                )
            ];


        await sleep(150);

    }


    document.body.classList.remove(
        "void-corruption"
    );

    warning.remove();


    line =
        newLine("system-text");


    await typeText(
        line,
        "corruption contained.",
        30
    );
}


/* =========================
   VOID #3
   BLACKOUT
========================= */

async function voidBlackout() {

    let line =
        newLine("system-text");


    await typeText(
        line,
        "hello?",
        60
    );


    await sleep(400);


    const blackout =
        document.createElement("div");


    blackout.className =
        "void-blackout";


    blackout.innerHTML =
        '<div id="blackout-message"></div>';


    document.body.appendChild(
        blackout
    );


    const message =
        blackout.querySelector(
            "#blackout-message"
        );


    await sleep(500);


    message.textContent =
        "ARE YOU STILL THERE?";


    await sleep(900);


    message.textContent =
        "";


    await sleep(250);


    message.textContent =
        "I CAN SEE YOU.";


    await sleep(800);


    blackout.classList.add(
        "blackout-end"
    );


    await sleep(250);


    blackout.remove();


    line =
        newLine("quote-text");


    await typeText(
        line,
        "...",
        150
    );
}


/* =========================
   VOID #4
   FAKE CRASH
========================= */

async function voidCrash() {

    let line =
        newLine("error-text");


    await typeText(
        line,
        "FATAL_SYSTEM_ERROR",
        25
    );


    await sleep(250);


    document.body.classList.add(
        "void-crash"
    );


    const warning =
        createVoidWarning(
            "FATAL ERROR"
        );


    await sleep(450);

    warning.textContent =
        "MEMORY CORRUPTION";


    await sleep(450);

    warning.textContent =
        "/dev/void OVERFLOW";


    await sleep(450);

    warning.textContent =
        "PROCESS 0000 TERMINATED";


    await sleep(450);

    warning.textContent =
        "REBOOTING...";


    await sleep(600);


    document.body.classList.remove(
        "void-crash"
    );

    warning.remove();


    line =
        newLine("system-text");


    await typeText(
        line,
        "system recovered.",
        30
    );
}


/* =========================
   VOID #5
   IT REMEMBERS
========================= */

async function voidRemember() {

    const darkness =
        document.createElement("div");


    darkness.className =
        "void-remember";


    darkness.innerHTML =
        `
        <div class="remember-text">
            IT REMEMBERS YOU.
        </div>
        `;


    document.body.appendChild(
        darkness
    );


    await sleep(700);


    darkness.classList.add(
        "remember-visible"
    );


    await sleep(1400);


    darkness.classList.remove(
        "remember-visible"
    );


    await sleep(400);


    darkness.remove();


    const line =
        newLine("quote-text");


    await typeText(
        line,
        "don't come back.",
        60
    );
}


/* =========================
   CREATE WARNING
========================= */

function createVoidWarning(text) {

    const warning =
        document.createElement("div");


    warning.className =
        "void-warning";


    warning.textContent =
        text;


    document.body.appendChild(
        warning
    );


    return warning;
}


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


/* =========================================
   MOVIE QUOTES
========================================= */

const movieQuotes = [

/* MORE BETTER CALL SAUL */

{
    quote: "Let's get down to brass tacks.",
    source: "Better Call Saul",
    year: "2015"
},

{
    quote: "Justice matters most.",
    source: "Better Call Saul",
    year: "2015"
},

{
    quote: "The law is sacred.",
    source: "Better Call Saul",
    year: "2015"
},


/* BREAKING BAD */

{
    quote: "Tread lightly.",
    source: "Breaking Bad",
    year: "2008"
},

{
    quote: "Say my name.",
    source: "Breaking Bad",
    year: "2008"
},

{
    quote: "No more half measures.",
    source: "Breaking Bad",
    year: "2008"
},


/* THE SOPRANOS */

{
    quote: "Remember when is the lowest form of conversation.",
    source: "The Sopranos",
    year: "1999"
},

{
    quote: "Those who want respect, give respect.",
    source: "The Sopranos",
    year: "1999"
},


/* MR. ROBOT */

{
    quote: "Control is an illusion.",
    source: "Mr. Robot",
    year: "2015"
},

{
    quote: "Hello, friend.",
    source: "Mr. Robot",
    year: "2015"
},


/* TRUE DETECTIVE */

{
    quote: "Time is a flat circle.",
    source: "True Detective",
    year: "2014"
},


/* BOJACK HORSEMAN */

{
    quote: "It gets easier.",
    source: "BoJack Horseman",
    year: "2014"
},


/* THE OFFICE */

{
    quote: "I'm not superstitious, but I am a little stitious.",
    source: "The Office",
    year: "2005"
},


/* SUCCESSION */

{
    quote: "You are not serious people.",
    source: "Succession",
    year: "2018"
},


/* GAME OF THRONES */

{
    quote: "Chaos isn't a pit. Chaos is a ladder.",
    source: "Game of Thrones",
    year: "2011"
},

{
    quote: "Not today.",
    source: "Game of Thrones",
    year: "2011"
},


/* THE MATRIX */

{
    quote: "There is no spoon.",
    source: "The Matrix",
    year: "1999"
},

{
    quote: "Wake up, Neo.",
    source: "The Matrix",
    year: "1999"
},


/* FIGHT CLUB */

{
    quote: "This is your life.",
    source: "Fight Club",
    year: "1999"
},

{
    quote: "You are not your job.",
    source: "Fight Club",
    year: "1999"
},


/* BLADE RUNNER */

{
    quote: "It's too bad she won't live.",
    source: "Blade Runner",
    year: "1982"
},


/* BLADE RUNNER 2049 */

{
    quote: "You look lonely.",
    source: "Blade Runner 2049",
    year: "2017"
},

{
    quote: "You look like a good Joe.",
    source: "Blade Runner 2049",
    year: "2017"
},


/* INTERSTELLAR */

{
    quote: "Love is the one thing we're capable of perceiving.",
    source: "Interstellar",
    year: "2014"
},


/* INCEPTION */

{
    quote: "An idea is like a virus.",
    source: "Inception",
    year: "2010"
},

{
    quote: "You mustn't be afraid to dream a little bigger.",
    source: "Inception",
    year: "2010"
},


/* THE DARK KNIGHT */

{
    quote: "Why so serious?",
    source: "The Dark Knight",
    year: "2008"
},

{
    quote: "Some men just want to watch the world burn.",
    source: "The Dark Knight",
    year: "2008"
},


/* BATMAN BEGINS */

{
    quote: "Why do we fall?",
    source: "Batman Begins",
    year: "2005"
},


/* TAXI DRIVER */

{
    quote: "You talkin' to me?",
    source: "Taxi Driver",
    year: "1976"
},


/* AMERICAN PSYCHO */

{
    quote: "I have to return some videotapes.",
    source: "American Psycho",
    year: "2000"
},


/* THE TRUMAN SHOW */

{
    quote: "Good morning!",
    source: "The Truman Show",
    year: "1998"
},


/* NO COUNTRY FOR OLD MEN */

{
    quote: "Call it.",
    source: "No Country for Old Men",
    year: "2007"
},


/* THE GODFATHER */

{
    quote: "I'm gonna make him an offer he can't refuse.",
    source: "The Godfather",
    year: "1972"
},


/* SCARFACE */

{
    quote: "Say hello to my little friend!",
    source: "Scarface",
    year: "1983"
},


/* GOODFELLAS */

{
    quote: "Funny how?",
    source: "Goodfellas",
    year: "1990"
},


/* PULP FICTION */

{
    quote: "Royale with Cheese.",
    source: "Pulp Fiction",
    year: "1994"
},


/* THE SHAWSHANK REDEMPTION */

{
    quote: "Get busy living, or get busy dying.",
    source: "The Shawshank Redemption",
    year: "1994"
},


/* TERMINATOR 2 */

{
    quote: "Hasta la vista, baby.",
    source: "Terminator 2",
    year: "1991"
},


/* ALIEN */

{
    quote: "In space, no one can hear you scream.",
    source: "Alien",
    year: "1979"
},


/* 2001 */

{
    quote: "I'm sorry, Dave.",
    source: "2001: A Space Odyssey",
    year: "1968"
},


/* DONNIE DARKO */

{
    quote: "Why are you wearing that stupid man suit?",
    source: "Donnie Darko",
    year: "2001"
},


/* WHIPLASH */

{
    quote: "Not quite my tempo.",
    source: "Whiplash",
    year: "2014"
},


/* NIGHTCRAWLER */

{
    quote: "What if my problem wasn't that I don't understand people?",
    source: "Nightcrawler",
    year: "2014"
},


/* THE SOCIAL NETWORK */

{
    quote: "A million dollars isn't cool.",
    source: "The Social Network",
    year: "2010"
},


/* DEAD POETS SOCIETY */

{
    quote: "Carpe diem. Seize the day.",
    source: "Dead Poets Society",
    year: "1989"
},


/* BACK TO THE FUTURE */

{
    quote: "Great Scott!",
    source: "Back to the Future",
    year: "1985"
},


/* STAR WARS */

{
    quote: "Do. Or do not. There is no try.",
    source: "The Empire Strikes Back",
    year: "1980"
},


/* LORD OF THE RINGS */

{
    quote: "You shall not pass!",
    source: "The Fellowship of the Ring",
    year: "2001"
},


/* THE SHINING */

{
    quote: "Here's Johnny!",
    source: "The Shining",
    year: "1980"
},


/* JOKER */

{
    quote: "Is it just me, or is it getting crazier out there?",
    source: "Joker",
    year: "2019"
}

];


const movieQuoteText =
    document.getElementById(
        "movie-quote-text"
    );


const movieInfo =
    document.getElementById(
        "movie-info"
    );


const newQuoteButton =
    document.getElementById(
        "new-quote"
    );


async function randomMovieQuote() {

    const random =
        Math.floor(
            Math.random() *
            movieQuotes.length
        );

    const selected =
        movieQuotes[random];


    /* HIDE MOVIE TITLE FIRST */

    movieInfo.classList.remove(
        "movie-info-show"
    );

    movieInfo.textContent = "";


    /* CHARACTERS USED FOR GLITCH */

    const glitchCharacters =
        "#@%&!?01XZ";


    const finalText =
        '"' + selected.quote + '"';


    /* SCRAMBLE */

    for (
        let frame = 0;
        frame < 8;
        frame++
    ) {

        let scrambled = "";


        for (
            let i = 0;
            i < finalText.length;
            i++
        ) {

            if (finalText[i] === " ") {

                scrambled += " ";

            }

            else {

                scrambled +=
                    glitchCharacters[
                        Math.floor(
                            Math.random() *
                            glitchCharacters.length
                        )
                    ];

            }

        }


        movieQuoteText.textContent =
            scrambled;


        await sleep(35);

    }


    /* REVEAL REAL QUOTE */

    movieQuoteText.textContent =
        finalText;


    /* SMALL DELAY */

    await sleep(250);


    /* REVEAL MOVIE */

    movieInfo.textContent =
        "— " +
        selected.source +
        " // " +
        selected.year;


    movieInfo.classList.add(
        "movie-info-show"
    );

}


/* RANDOM QUOTE WHEN PAGE OPENS */

randomMovieQuote();


/* NEW QUOTE BUTTON */

newQuoteButton.addEventListener(
    "click",
    randomMovieQuote
);
const japaneseRandom =
    document.getElementById("japanese-random");

const japaneseChars =
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

// Starting characters
let characters = [];

for (let i = 0; i < 35; i++) {

    characters.push(
        japaneseChars[
            Math.floor(
                Math.random() *
                japaneseChars.length
            )
        ]
    );
}

// Display first version
japaneseRandom.textContent =
    characters.join("");


// Change ONE character at a time
function animateJapanese() {

    const position =
        Math.floor(
            Math.random() *
            characters.length
        );

    characters[position] =
        japaneseChars[
            Math.floor(
                Math.random() *
                japaneseChars.length
            )
        ];

    japaneseRandom.textContent =
        characters.join("");
}


// Change one every 100ms
setInterval(animateJapanese, 30);

window.addEventListener("load", async function () {

    try {

        await music.play();

    } catch {

        document.addEventListener(
            "click",
            startMusicOnce
        );

        document.addEventListener(
            "touchstart",
            startMusicOnce
        );

    }

});


function startMusicOnce() {

    music.play();

    document.removeEventListener(
        "click",
        startMusicOnce
    );

    document.removeEventListener(
        "touchstart",
        startMusicOnce
    );
}