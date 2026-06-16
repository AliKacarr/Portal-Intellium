import React from 'react'
import VCardWidget from "../Widgets/vCard/vCardWidget";

const ProfileCard = ({ user }) => {


     return (
          <VCardWidget
               style={{ height: "413px" }}
               src={user.imageUrl}
               name={user.name}
               id={user.id}
               size={100}
               title={user.jobTitle}
               description={user.customer.customerName}  >

          </VCardWidget>
     )
}

export default ProfileCard