import { useState, useEffect } from "react";
import Release from "./components/Release";
import "./App.css";
import { ReleaseDetails } from "./types";
import { Row, Col, List } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";

interface ReleasePrimaryKey {
  createdAt?: number;
  userId?: number;
}

function App() {
  const [loading, setLoading] = useState<Boolean>(false);
  const [releases, setReleases] = useState<ReleaseDetails[]>([]);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<ReleasePrimaryKey>(
    {}
  );

  const fetchReleases = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    const body: any = {};
    if (Object.keys(lastEvaluatedKey).length) {
      body.startKey = lastEvaluatedKey;
    }

    const result = await fetch(
      process.env.REACT_APP_API_GATEWAY_URL as string,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const resultJson = await result.json();

    setReleases([...releases, ...resultJson.items]);
    setLastEvaluatedKey(resultJson.lastEvaluatedKey);
    setLoading(false);
  };

  useEffect(() => {
    fetchReleases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Row justify="center">
      <Col span={12}>
        <h1 className="title">New Releases</h1>
        <InfiniteScroll
          dataLength={releases.length}
          next={fetchReleases}
          hasMore={lastEvaluatedKey != null}
          endMessage={"All done!"}
          loader={<h3>Loading...</h3>}
        >
          <List
            size="large"
            itemLayout="vertical"
            dataSource={releases}
            renderItem={(item) => <Release release={item} />}
          />
        </InfiniteScroll>
      </Col>
    </Row>
  );
}

export default App;
