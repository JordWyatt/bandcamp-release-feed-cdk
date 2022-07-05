import React from "react";
import { ReleaseDetails } from "../types";
import { List, Avatar } from "antd";

type ReleaseProps = {
  release: ReleaseDetails;
  onClick: () => void;
};

const Release = ({ release, onClick }: ReleaseProps) => {
  const description =
    release.artist === release.label
      ? release.artist
      : `${release.artist} - [${release.label}]`;

  const createdAt = new Date(release.createdAt).toDateString();

  return (
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a href={release.releaseId ? "#" : release.url}>
      <List.Item extra={createdAt} onClick={onClick}>
        <List.Item.Meta
          avatar={<Avatar src={release.image} shape="square" size={128} />}
          title={release.title}
          description={description}
        />
      </List.Item>
    </a>
  );
};

export default Release;
