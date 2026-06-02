import { Types } from 'mongoose';
import { isBookingParty, isSameId, toId } from './mongo-id.utils';

describe('mongo-id.utils', () => {
  it('toId handles string', () => {
    expect(toId('abc')).toBe('abc');
  });

  it('toId handles ObjectId', () => {
    const oid = new Types.ObjectId();
    expect(toId(oid)).toBe(oid.toString());
  });

  it('toId handles populated user', () => {
    const oid = new Types.ObjectId();
    expect(toId({ _id: oid, fullName: 'James' })).toBe(oid.toString());
  });

  it('isSameId compares populated to string', () => {
    const oid = new Types.ObjectId();
    expect(isSameId({ _id: oid, fullName: 'X' }, oid.toString())).toBe(true);
  });

  it('isBookingParty matches either side', () => {
    const requester = new Types.ObjectId();
    const traveler = new Types.ObjectId();
    expect(
      isBookingParty(
        requester.toString(),
        { _id: requester, fullName: 'R' },
        traveler,
      ),
    ).toBe(true);
  });
});
