# Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Update Backend URL
Before deploying, update the backend URL in `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-domain.com/api' // Replace with your actual backend URL
};
```

### 2. Build for Production
```bash
ng build --prod
```

### 3. Deploy Frontend

#### Option A: Netlify (Recommended - Free)
1. Go to [netlify.com](https://netlify.com)
2. Sign up/login
3. Drag and drop the `dist/stress-admin-fd2/` folder
4. Your app will be live at `https://random-name.netlify.app`

#### Option B: Vercel (Free)
1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Vercel will auto-deploy on every push

#### Option C: GitHub Pages
```bash
ng build --prod --base-href="/stress-admin/"
# Upload dist/ folder to GitHub Pages
```

### 4. Deploy Backend

#### Option A: Heroku (Free tier)
1. Create `Procfile` in backend root:
```
web: java -jar target/stress-admin-backend-0.0.1-SNAPSHOT.jar
```
2. Deploy to Heroku
3. Update frontend environment.prod.ts with Heroku URL

#### Option B: AWS EC2
1. Launch EC2 instance
2. Upload JAR file
3. Configure security groups for port 8082
4. Update frontend with EC2 public IP

## ✅ What Will Work Exactly the Same

- ✅ All UI/UX features (pagination, animations, styling)
- ✅ All functionality (run/stop tests, view reports)
- ✅ Responsive design (mobile/tablet layouts)
- ✅ Real-time features (live updates, status changes)
- ✅ File uploads and downloads
- ✅ Summary report generation

## ⚠️ Important Notes

1. **CORS Configuration**: Ensure your backend allows requests from your frontend domain
2. **File Storage**: Make sure file uploads work in your deployment environment
3. **Environment Variables**: Update `environment.prod.ts` with your actual backend URL
4. **HTTPS**: Use HTTPS for both frontend and backend in production

## 🔧 Troubleshooting

### Common Issues:
1. **CORS Errors**: Add your frontend domain to backend CORS configuration
2. **File Upload Issues**: Check file permissions and storage paths
3. **API Connection**: Verify backend URL in environment.prod.ts

### Testing Deployment:
1. Deploy backend first
2. Test backend endpoints directly
3. Update frontend environment.prod.ts
4. Deploy frontend
5. Test full functionality

## 📞 Support

If you encounter issues during deployment, check:
1. Browser console for errors
2. Network tab for failed requests
3. Backend logs for server errors
4. CORS configuration
5. Environment variable settings
