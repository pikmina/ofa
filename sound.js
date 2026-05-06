$(document).ready(function () {
    var audio = document.getElementById("audio");

    // Botones
    var playPauseButton = $("#play-pause-button");
    var nextButton = $("#next-button");
    var prevButton = $("#prev-button");

    // Barra de progreso
    var sArea = $("#s-area"),
        seekBar = $("#seek-bar"),
        insTime = $("#ins-time"),
        sHover = $("#s-hover"),
        i = playPauseButton.find("em"),
        tProgress = $("#current-time"),
        tTime = $("#track-length");

    // Volumen
    var volumeFill = $("#volume-fill");
    var volumePin = $("#volume-pin");
    var volumeBar = $(".volume-bar");

    // Título y artista
    var songTitle = $("#song-title");
    var songArtist = $("#song-artist");

    // --- Playlist --- ACÁ SE CAMBIAN LAS CANCIONES
    // --- Playlist --- ACÁ SE CAMBIAN LAS CANCIONES
    var playlist = [
        {
            src: "https://dl.dropboxusercontent.com/scl/fi/9781cyfzdh3dxr5pfen8s/All-The-Stars-with-SZA-From-Black-Panther-The-Album.mp3?rlkey=ot1hdvuclfnm1hfxo4p6j3k4u&st=2kazzi8o&dl=0",
            title: "All The Stars",
            artist: "Kendrick Lamar, SZA"
        },
        {
            src: "https://dl.dropboxusercontent.com/scl/fi/2aup3x89d2n7hdjr5mxnq/Bokurano.mp3?rlkey=7dnlav6ta37jpfga49cng69cj&st=nuw37vo9&dl=0",
            title: "Bokurano",
            artist: "Eve"
        },
        {
            src: "https://dl.dropboxusercontent.com/scl/fi/ug7g736yzifc1kh7vf0gl/Born-For-This.mp3?rlkey=qe3v71s6rmmqdc70db8rewfyv&st=fjhldrze&dl=0",
            title: "Born For This",
            artist: "The Score"
        },
        {
            src: "https://dl.dropboxusercontent.com/scl/fi/w9jngpa6znw0xhzvc3vm1/Control.mp3?rlkey=pjyt6so09322z3jkwoosivn4j&st=s7zghifv&dl=0",
            title: "Control",
            artist: "Zara Larsson"
        },
        {
            src: "https://dl.dropboxusercontent.com/scl/fi/3zbssm85zfb12ad662k0k/Enemy-with-JID-from-the-series-Arcane-League-of-Legends.mp3?rlkey=c3amzque4idls1wv5qpevkbdb&st=1phdgxzv&dl=0",
            title: "Enemy",
            artist: "JID"
        },
        {
            src: "https://dl.dropboxusercontent.com/scl/fi/1h7l5n9y8j0m2c6gq4s8e/Legendary.mp3?rlkey=9v1h7l5n9y8j0m2c6gq4s8e&st=1h7l5n9y8j0m2c6gq4s8e&dl=0",
            title: "Legendary",
            artist: "Welch, Denzel Curry, Sampa The Great, Rapsody"
        },
        {
            src: "https://dl.dropboxusercontent.com/scl/fi/at8uvxdp4x0pe6nzcd3yf/Everybody-Wants-To-Rule-The-World-From-The-Hunger-Games-Catching-Fire-Soundtrack.mp3?rlkey=y6hf4a688a4sws1w8sm2919yp&st=6i5265s0&dl=0",
            title: "Everybody Wants To Rule The World",
            artist: "Lorde"
        },
        {
            src: "https://dl.dropboxusercontent.com/scl/fi/kps47et565lkdgpxgz0y5/GIANTS.mp3?rlkey=c4c7nzy34txih62mseavsh2iy&st=4f4f8ac6&dl=0",
            title: "GIANTS",
            artist: "Dermot Kennedy"
        },
        {
            src: "https://dl.dropboxusercontent.com/scl/fi/3s1qz5g3aez62tj0j5dbl/GO-Beyond.mp3?rlkey=cg6yzbgx9q3299jxgv1dm9q70&st=4jcmch6m&dl=0",
            title: "GO Beyond",
            artist: "Yuki Hayashi"
        },
        {
            src: "https://dl.dropboxusercontent.com/scl/fi/or230wpoar27tcro9p09m/GODS.mp3?rlkey=bnwlt7ftpgpjdd2b8no0tv5yo&st=ea7chsa1&dl=0",
            title: "GODS",
            artist: "NewJeans"
        },
        {
            src: "https://dl.dropboxusercontent.com/scl/fi/mcpls40k6ky31qw4crdog/Heathens.mp3?rlkey=k1srsiqkocvqlaw8o307rudwr&st=a4hc7ktg&dl=0",
            title: "Heathens",
            artist: "21 Pilots"
        },
        {
            src: "https://dl.dropboxusercontent.com/scl/fi/rsmcpyok2pl1aknpolp58/Hero-too.mp3?rlkey=k6kjyeqapjgsa0x1mlfjj3j2n&st=x2ffreyy&dl=0",
            title: "Hero Too",
            artist: "Kyoka Jiro ft. Crissy Constanza and Yuki Hayashi"
        },
        {
            src: "https://dl.dropboxusercontent.com/scl/fi/x1dw1fbevauuif8kpilhf/Legends-Never-Die.mp3?rlkey=92jj72myvpgjfd7chagovz9i6&st=z5980arw&dl=0",
            title: "Legends Never Die",
            artist: "Against the Current"
        }
    ];



    // == NO TOCAR A PARTIR DE ACÁ ==
    var currentTrack = 0;
    var isTrackLoaded = false;

    function initUI() {
        var track = playlist[currentTrack];
        songTitle.text(track.title);
        songArtist.text(track.artist);

        tProgress.text("00:00");
        tTime.text("00:00");
        seekBar.width(0);
        i.attr("class", "fa-solid fa-play");

        audio.src = "";
        isTrackLoaded = false;
    }

    function loadCurrentTrack() {
        if (isTrackLoaded) return;

        var track = playlist[currentTrack];
        audio.src = track.src;
        isTrackLoaded = true;

        audio.addEventListener('loadedmetadata', function onLoaded() {
            tTime.text(
                `${Math.floor(audio.duration / 60).toString().padStart(2, "0")}:${Math.floor(audio.duration % 60).toString().padStart(2, "0")}`
            );
            audio.removeEventListener('loadedmetadata', onLoaded);
        });
    }

    initUI();

    playPauseButton.on("click", function () {
        if (!isTrackLoaded) {
            loadCurrentTrack();

            audio.load();

            audio.play().then(() => {
                i.attr("class", "fa-solid fa-pause");
            }).catch((error) => {
                console.log("Error al reproducir:", error);
                // Si hay error, intentar de nuevo
                setTimeout(() => {
                    audio.play().catch(() => { });
                }, 100);
            });
        } else if (audio.paused) {
            audio.play().then(() => {
                i.attr("class", "fa-solid fa-pause");
            }).catch(() => { });
        } else {
            audio.pause();
            i.attr("class", "fa-solid fa-play");
        }
    });

    function playTrack(index) {
        if (index < 0) index = playlist.length - 1;
        if (index >= playlist.length) index = 0;

        currentTrack = index;

        var track = playlist[currentTrack];
        songTitle.text(track.title);
        songArtist.text(track.artist);


        isTrackLoaded = false;
        audio.src = "";
        audio.currentTime = 0;


        tProgress.text("00:00");
        tTime.text("00:00");
        seekBar.width(0);

        if (!audio.paused) {
            loadCurrentTrack();
            audio.load();
            audio.play().then(() => {
                i.attr("class", "fa-solid fa-pause");
            }).catch(() => { });
        } else {
            i.attr("class", "fa-solid fa-play");
        }
    }

    nextButton.on("click", function () { playTrack(currentTrack + 1); });
    prevButton.on("click", function () { playTrack(currentTrack - 1); });


    sArea.on("mousemove", showHover);
    sArea.on("click", playFromClickedPos);
    audio.addEventListener("timeupdate", updateCurrTime);
    audio.addEventListener("ended", function () {
        playTrack(currentTrack + 1);
    });

    function showHover(event) {
        if (!isTrackLoaded || isNaN(audio.duration)) return;

        var seekBarPos = sArea.offset();
        var seekT = event.clientX - seekBarPos.left;
        var seekLoc = audio.duration * (seekT / sArea.outerWidth());

        sHover.width(seekT);

        var m = Math.floor(seekLoc / 60);
        var s = Math.floor(seekLoc % 60);
        insTime.text(isNaN(m) ? "--:--" : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
        insTime.css({ left: seekT, "margin-left": "-21px" }).show();
    }

    function playFromClickedPos(event) {
        if (!isTrackLoaded || isNaN(audio.duration)) return;

        var seekBarPos = sArea.offset();
        var seekT = event.clientX - seekBarPos.left;
        audio.currentTime = audio.duration * (seekT / sArea.outerWidth());
        seekBar.width(seekT);
    }

    function updateCurrTime() {
        if (!isTrackLoaded || isNaN(audio.duration)) return;

        var cur = audio.currentTime;
        var dur = audio.duration;

        tProgress.text(
            `${Math.floor(cur / 60).toString().padStart(2, "0")}:${Math.floor(cur % 60).toString().padStart(2, "0")}`
        );

        seekBar.width((cur / dur) * 100 + "%");

        // LÍNEA ELIMINADA DE AQUÍ
    }


    audio.volume = 0.2;

    function updateVolume(e) {
        var rect = volumeBar[0].getBoundingClientRect();
        var x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        var percentage = x / rect.width;

        audio.volume = percentage;
        updateVolumeVisual(percentage);
    }

    function updateVolumeVisual(percentage) {
        var width = volumeBar.width();
        var px = percentage * width;

        volumeFill.css("width", px + "px");
        volumePin.css("left", px + "px");
    }

    volumePin.on("mousedown", function (e) {
        e.preventDefault();
        $(document).on("mousemove.volume", updateVolume);
        $(document).on("mouseup.volume", stopVolumeDrag);
    });

    volumeBar.on("mousedown", function (e) {
        updateVolume(e);
        $(document).on("mousemove.volume", updateVolume);
        $(document).on("mouseup.volume", stopVolumeDrag);
    });

    function stopVolumeDrag() {
        $(document).off(".volume");
    }


    function toggleContent() {
        var aud2 = document.querySelector(".aud-2");
        if (!aud2) return;

        var isHidden = aud2.style.display === "none" || aud2.style.display === "";
        aud2.style.display = isHidden ? "block" : "none";

        if (isHidden) {
            requestAnimationFrame(() => {
                updateVolumeVisual(audio.volume);
            });
        }
    }

    window.toggleContent = toggleContent;
});