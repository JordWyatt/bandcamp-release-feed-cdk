import { ReleaseDetails } from "../types";
import useWindowDimensions from "../hooks/useWindowDimensions";
import "../App.css";

type AppProps = {
  release: ReleaseDetails;
};

const Player = ({ release }: AppProps) => {
  const { height, width } = useWindowDimensions();
  const { url, releaseId, title, artist, type } = release;

  return (
    <iframe
      className="player"
      title={releaseId.toString()}
      src={`https://bandcamp.com/EmbeddedPlayer/${type}=${releaseId}/size=large/bgcol=ffffff/linkcol=0687f5/artwork=small/${
        width <= 700 && "tracklist=false/"
      }transparent=true/`}
      seamless
    >
      <a href={url}>
        {title} by {artist}
      </a>
    </iframe>
  );
};

export default Player;
