import { ReleaseDetails } from "../types";

type AppProps = {
  release: ReleaseDetails;
};

const Player = ({ release }: AppProps) => {
  const { url, releaseId, title, artist, type } = release;
  return (
    <div>
      <iframe
        title={releaseId.toString()}
        style={{
          border: 0,
          width: "400px",
          height: "208px",
          position: "fixed",
          bottom: 0,
          right: 0,
        }}
        src={`https://bandcamp.com/EmbeddedPlayer/${type}=${releaseId}/size=large/bgcol=ffffff/linkcol=0687f5/artwork=small/transparent=true/`}
        seamless
      >
        <a href={url}>
          {title} by {artist}
        </a>
      </iframe>
    </div>
  );
};

export default Player;
