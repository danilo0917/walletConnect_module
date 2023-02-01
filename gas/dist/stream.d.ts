import { Observable } from 'rxjs';
import { StreamOptions, GasPlatformResponse } from './types.js';
declare function stream(options: StreamOptions): Observable<GasPlatformResponse[]>;
export default stream;
