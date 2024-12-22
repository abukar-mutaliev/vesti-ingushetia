import { useState } from 'react';
import useSound from 'use-sound';
import qala from '../assets/qala.mp3';
import { AiFillPlayCircle, AiFillPauseCircle } from 'react-icons/ai';
import { BiSkipNext, BiSkipPrevious } from 'react-icons/bi';
import { IconContext } from 'react-icons';

export const RadioPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [play, { pause }] = useSound(qala);
    const playingButton = () => {
        if (isPlaying) {
            pause();
            setIsPlaying(false);
        } else {
            play();
            setIsPlaying(true);
        }
    };

    return (
        <div className="component">
            <h2>Playing Now</h2>
            <img className="musicCover" src="https://picsum.photos/200/200" />
            <div>
                <h3 className="title">Rubaiyyan</h3>
                <p className="subTitle">Qala</p>
            </div>
            <div>
                <button className="playButton">
                    <IconContext.Provider
                        value={{ size: '3em', color: '#27AE60' }}
                    >
                        <BiSkipPrevious />
                    </IconContext.Provider>
                </button>
                {!isPlaying ? (
                    <button className="playButton" onClick={playingButton}>
                        <IconContext.Provider
                            value={{ size: '3em', color: '#27AE60' }}
                        >
                            <AiFillPlayCircle />
                        </IconContext.Provider>
                    </button>
                ) : (
                    <button className="playButton" onClick={playingButton}>
                        <IconContext.Provider
                            value={{ size: '3em', color: '#27AE60' }}
                        >
                            <AiFillPauseCircle />
                        </IconContext.Provider>
                    </button>
                )}
                <button className="playButton">
                    <IconContext.Provider
                        value={{ size: '3em', color: '#27AE60' }}
                    >
                        <BiSkipNext />
                    </IconContext.Provider>
                </button>
            </div>
        </div>
    );
};
