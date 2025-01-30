router.get('/verify-student/:agoraUid', async (req, res) => {
  try {
    const client = AgoraRTC.createClient({ mode: 'live' });
    const userInfo = await client.getUserInfoByUid(req.params.agoraUid);
    const metadata = JSON.parse(userInfo.metadata);
    
    // Verify the auth token with your authentication system
    const isValid = await verifyAuthToken(metadata.userId, metadata.authToken);
    
    res.status(isValid ? 200 : 403).json({ valid: isValid });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
}); 