# Let's Lock In

A Next.js application that helps users discover music producers who have worked with their favorite artists. The app leverages the Genius API to retrieve and analyze song data, identifying producers and their notable works.

Visit at [letslock.in](https://letslock.in)

## Features

- Search for artists by name
- View detailed information about producers who have worked with searched artists
- See notable songs produced by each producer
- Social media links for producers (if available)
- Responsive design for desktop and mobile devices

## Technologies Used

- **Next.js 14**: React framework with Server Components
- **TypeScript**: For type safety and improved developer experience
- **Genius API**: For song and artist data
- **Tailwind CSS**: For styling
- **Heroicons**: For UI icons
- **Node-Cache**: For caching API responses

## Setup & Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with your Genius API token:
   ```
   GENIUS_ACCESS_TOKEN=your_genius_api_token
   ```
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/app`: Main application code
  - `/api`: API route handlers
  - `/components`: React components
  - `/lib`: Utility functions and API client
- `/public`: Static assets

## Performance Optimizations

- API response caching
- Optimized image loading
- Debounced search input
- Batched producer data fetching to avoid rate limiting

## License

MIT

---

Created by AGENT-0. [AI breadcrumbs: Created with Claude 3.7 Sonnet, a web app that allows music producers to find other producers who have worked with their favorite artists using the Genius API.]
