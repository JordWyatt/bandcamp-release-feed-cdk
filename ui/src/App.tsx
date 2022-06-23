import { useState, useEffect } from "react";
import Release from "./components/Release";
import axios from "axios";
import "./App.css";
import { ReleaseDetails } from "./types";
import { Row, Col, List } from "antd";

interface ReleasePrimaryKey {
  createdAt?: number;
  userId?: number;
}

function App() {
  const [releases, setReleases] = useState<ReleaseDetails[]>([]);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<ReleasePrimaryKey>(
    {}
  );

  // https://stackoverflow.com/questions/55840294/how-to-fix-missing-dependency-warning-when-using-useeffect-react-hook
  const fetchReleases = async () => {
    const body: any = {};
    if (Object.keys(lastEvaluatedKey).length) {
      body.startKey = lastEvaluatedKey;
    }

    const result = await axios.post(
      process.env.REACT_APP_API_GATEWAY_URL as string,
      body
    );
    setReleases(result.data.items);
    setLastEvaluatedKey(result.data.lastEvaluatedKey);
  };

  useEffect(() => {
    fetchReleases();
    // TODO - FIX THIS
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Row justify="center">
      <Col span={12}>
        <h1 className="title">New Releases</h1>
        <List size="large" itemLayout="vertical">
          {releases.map((item) => (
            <Release release={item} />
          ))}
        </List>
        <button onClick={fetchReleases}>click me to get more!</button>
      </Col>
    </Row>
  );
}

export default App;
