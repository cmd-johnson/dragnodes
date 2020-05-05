import { ConnectorType } from "./connector-type";
import { SourceConnector, SinkConnector } from './connector';
import { Subject, combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';

class TestConnectorType extends ConnectorType<string> { }

describe('SourceConnector', () => {
  let testConnectorType: TestConnectorType;

  beforeEach(() => {
    testConnectorType = new TestConnectorType();
  });

  it('should be able to add SinkConnectors', () => {
    const source = new SourceConnector<TestConnectorType>(testConnectorType);
    const sink = new SinkConnector<TestConnectorType>(testConnectorType);
  });
});
