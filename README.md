# Now Playing on West End

This project aggregates Broadway show data from multiple sources and presents it in one easy-to-read website. Updated every week, this website displays important information such as a show's closing date and whether the show is considered a play or musical.

**Live Demo:** <a href="https://now-playing-on-west-end.vercel.app/" target="_blank">Click Here </a>  

This application is hosted online on <a href="https://vercel.com" target="_blank">Vercel</a>. Data displayed on this website is updated every Monday at 12:00 AM. 

---

## Data Sources

The following public sources are used for this project:

- <a href="https://www.londontheatre.co.uk/whats-on" target="_blank">www.londontheatre.co.uk </a>: Displays up-to-date West End show list and photos
- <a href="https://en.wikipedia.org/wiki/Broadway_theatre" target="_blank">Wikipedia – Broadway Theatre</a>: Displays up-to-date West End opening and closing dates (photos from Wikipedia are used as backup if previous link does not have it)

---

## Local Deployment

### Prerequisites

In order to test this project on your own computer, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS recommended)  
- One of the following package managers:
  - [**npm** (comes with Node.js)](https://www.npmjs.com/get-npm)  
  - [**Yarn**](https://classic.yarnpkg.com/en/docs/install)
  - [**pnpm**](https://pnpm.io/installation)
  - [**Bun**](https://bun.sh/)

### Step 1: Clone the repository 

Open a terminal or command prompt on your computer and type in the following:

```bash
   git clone https://github.com/kcohen1997/Current-Broadway-Show-List.git
   cd current-broadway-show-list
```

This will create a copy of the project and send you to the folder containing the project.

### Step 2: Install Dependencies

After cloning the repository, you will need to install all of the required packages and dependencies.

Type in one of the following command (depends on which package manager you are using):

#### NPM
```bash
npm install
```
#### Yarn
```bash
yarn install
```

#### PNPM
```bash
pnpm install
```
#### Bun
```bash
bun install
```

### Step 3: Run the Development Server

You are now ready to run the application locally on your computer. Type in one of the following commands:

#### NPM
```bash
npm run dev
```
#### Yarn
```bash
yarn dev
```

#### PNPM
```bash
pnpm dev
```

#### Bun
```bash
bun dev
```
### Step 4: Access the Application

After starting the development server, open your web browser and navigate to.

[http://localhost:3000](http://localhost:3000)

You should see the **Current Broadway Show List** homepage with most recent data.


