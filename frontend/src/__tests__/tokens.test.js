import { setSession, getStoredUser, getAccessToken, getRefreshToken, clearSession } from '../storage/tokens';

describe('tokens storage', () => {
    beforeEach(() => localStorage.clear());

    it('setSession stores accessToken, refreshToken, and user', () => {
        const user = { id: '1', email: 'test@example.com', role: 'employer' };
        setSession({ accessToken: 'access-abc', refreshToken: 'refresh-xyz', user });
        expect(localStorage.getItem('jobhub.accessToken')).toBe('access-abc');
        expect(localStorage.getItem('jobhub.refreshToken')).toBe('refresh-xyz');
        expect(JSON.parse(localStorage.getItem('jobhub.user'))).toEqual(user);
    });

    it('getStoredUser returns the stored user object', () => {
        const user = { id: '2', email: 'candidate@example.com', role: 'candidate' };
        setSession({ user });
        expect(getStoredUser()).toEqual(user);
    });

    it('getStoredUser returns null when nothing is stored', () => {
        expect(getStoredUser()).toBeNull();
    });

    it('getAccessToken returns the stored access token', () => {
        setSession({ accessToken: 'my-token' });
        expect(getAccessToken()).toBe('my-token');
    });

    it('getRefreshToken returns the stored refresh token', () => {
        setSession({ refreshToken: 'my-refresh' });
        expect(getRefreshToken()).toBe('my-refresh');
    });

    it('clearSession removes all three keys', () => {
        const user = { id: '1', email: 'test@example.com', role: 'employer' };
        setSession({ accessToken: 'abc', refreshToken: 'xyz', user });
        clearSession();
        expect(localStorage.getItem('jobhub.accessToken')).toBeNull();
        expect(localStorage.getItem('jobhub.refreshToken')).toBeNull();
        expect(localStorage.getItem('jobhub.user')).toBeNull();
    });
});
