import MemoryIcon from "@mui/icons-material/Memory";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Icon,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";

const style = {
  width: "100%",
  padding: "0px",
  margin: "0px",
  maxWidth: 360,
  bgcolor: "background.paper",
};

interface SensorCardProps {
  device: {
    info: {
      name: string;
      type: string;
    };
  };
}

const SensorCard: React.FC<SensorCardProps> = () => {
  const [cpuInfo, setCPUInfo] = useState<CpuData | null>(null);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      // const cpuData = await si.cpu();
      // setCPUInfo(cpuData);
    };

    fetchSystemInfo();
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 360,
        bgcolor: "background.paper",
        padding: "0px",
        my: 3,
        mx: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "#2699D0",
          width: "100%",
          height: "auto",
          padding: "10px",
          textAlign: "center",
          color: "#FFF",
        }}
      >
        <MemoryIcon sx={{ fontSize: 40, mx: 0.5 }} />
        <Typography
          variant='h3'
          sx={{
            display: "flex",
            alignItems: "center",
            fontWeight: "bold",
            textAlign: "middle",
            mx: 0.5,
          }}
        >
          20.0%
        </Typography>
      </Box>
      <Box
        sx={{
          width: "100%",
          height: "auto",
          padding: "10px",
          textAlign: "center",
        }}
      >
        <Typography
          variant='h6'
          sx={{
            display: "flex",
            alignItems: "center",
            fontWeight: "bold",
            textAlign: "middle",
            mx: 0.5,
          }}
        ></Typography>
      </Box>
    </Box>
  );

  // return (
  //   <Card sx={{ minWidth: 275 }}>
  //     <CardContent>
  //       <List sx={style} component='nav' aria-label='mailbox folders'>
  //         <ListItem
  //           style={{
  //             display: "flex",
  //             alignItems: "center",
  //             justifyContent: "center",
  //             bgcolor: "#2699D0",
  //           }}
  //         >
  //           <IconButton aria-label='delete'>
  //             {/* <Icon>lightbulb</Icon> */}
  //           </IconButton>
  //           <ListItemText primary={props.device.info.name} />
  //         </ListItem>
  //         <ListItem button>
  //           <ListItemText primary='Inbox' />
  //         </ListItem>
  //         <Divider />
  //         <ListItem button divider>
  //           <ListItemText primary='Drafts' />
  //         </ListItem>
  //         <ListItem button>
  //           <ListItemText primary='Trash' />
  //         </ListItem>
  //         <Divider light />
  //         <ListItem button>
  //           <ListItemText primary='Spam' />
  //         </ListItem>
  //       </List>
  //     </CardContent>
  //   </Card>
  // );
};

{
  /* <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          Word of the Day
        </Typography>
        <Typography variant="h5" component="div">
          be{bull}nev{bull}o{bull}lent
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          adjective
        </Typography>
        <Typography variant="body2">
          well meaning and kindly.
          <br />
          {'"a benevolent smile"'}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small">Learn More</Button>
      </CardActions> */
}

const Sensor = (props) => {
  return (
    <div className='device-card'>
      <div className='device-card__name'>{props.name}</div>
      <div className='device-card__status'>{props.status}</div>
      <div className='device-card__type'>{props.type}</div>
      <div className='device-card__value'>{props.value}</div>
    </div>
  );
};

export default SensorCard;

// import React, { useState, useEffect } from 'react';

// const App = () => {
//   const [users, setUsers] = useState([]);

//   useEffect(() => {
//     fetch('/api/users')
//       .then(response => response.json())
//       .then(data => setUsers(data));
//   }, []);

//   return (
//     <div>
//       <h1>List of Users</h1>
//       <ul>
//         {users.map(user => (
//           <li key={user.id}>{user.name}</li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default App;

// import React, { useState, useEffect } from 'react';

// const UserList = ({ users }) => (
//   <ul>
//     {users.map(user => (
//       <li key={user.id}>{user.name}</li>
//     ))}
//   </ul>
// );

// const App = () => {
//   const [users, setUsers] = useState([]);

//   useEffect(() => {
//     fetch('/api/users')
//       .then(response => response.json())
//       .then(data => setUsers(data));
//   }, []);

//   return (
//     <div>
//       <h1>List of Users</h1>
//       <UserList users={users} />
//     </div>
//   );
// };

// export default App;
