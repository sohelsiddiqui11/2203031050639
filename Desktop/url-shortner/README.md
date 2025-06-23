# URL Shortener

A microservice for shortening URLs with customizable shortcodes and expiry times.

## Features

- Create shortened URLs with optional custom shortcodes
- Automatic generation of unique shortcodes
- Configurable URL expiry (default: 30 minutes)
- URL redirection with click tracking
- Statistics for shortened URLs

## API Endpoints

### Create Short URL
- **URL**: `/api/shorturls`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "url": "https://example.com/very-long-url",
    "validity": 30,
    "shortcode": "abcd1"
  }
  ```
  - `url` (string, required): The original URL to shorten
  - `validity` (integer, optional): Duration in minutes for which the short link remains valid (defaults to 30)
  - `shortcode` (string, optional): Custom shortcode (if omitted, a unique shortcode will be generated)
- **Response**: 
  ```json
  {
    "shortLink": "http://localhost:5000/abcd1",
    "expiry": "2023-06-01T12:30:00Z"
  }
  ```

### Redirect to Original URL
- **URL**: `/:shortcode`
- **Method**: `GET`
- **Response**: Redirects to the original URL

### Get URL Statistics
- **URL**: `/api/shorturls/:shortcode`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "originalUrl": "https://example.com/very-long-url",
    "shortUrl": "http://localhost:5000/abcd1",
    "clicks": 5,
    "createdAt": "2023-06-01T12:00:00Z",
    "expiryDate": "2023-06-01T12:30:00Z",
    "isExpired": false,
    "clickData": [
      {
        "timestamp": "2023-06-01T12:05:00Z",
        "referrer": "Direct",
        "location": "127.0.0.1"
      }
    ]
  }
  ```

