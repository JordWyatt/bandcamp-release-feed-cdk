import React, { useEffect } from "react";
import Release from "./components/Release";
import axios from "axios";
import "./App.css";
import { ReleaseDetails } from "./types";
import { Row, Col, List } from "antd";

function App() {
  const [releases, setReleases] = React.useState<ReleaseDetails[]>([]);

  useEffect(() => {
    const fetchReleases = async () => {
      const result = await axios.get(
        process.env.REACT_APP_API_GATEWAY_URL as string
      );
      setReleases(result.data);
    };

    fetchReleases();
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
      </Col>
    </Row>
  );
}

export default App;
