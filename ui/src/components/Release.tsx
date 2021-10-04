import React from "react";
import { ReleaseDetails } from "../types";
import { List, Avatar } from "antd";

type ReleaseProps = {
  release: ReleaseDetails;
};

const Release = ({ release }: ReleaseProps) => {
  const description =
    release.artist === release.label
      ? release.artist
      : `${release.artist} - [${release.label}]`;

  const createdAt = new Date(release.createdAt).toDateString();

  return (
    <a href={release.url}>
      <List.Item extra={createdAt}>
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
