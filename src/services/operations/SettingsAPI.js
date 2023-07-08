import { toast } from "react-hot-toast"

import { setUser } from "../../slices/profileSlice"
import { apiConnector } from "../apiconnector"
import { settingsEndpoints } from "../apis"
import { logout } from "./authAPI"
import { useSelector } from "react-redux"
import { useDispatch } from "react-redux"
import { Dispatch } from "react"
const {
  UPDATE_DISPLAY_PICTURE_API,
  UPDATE_PROFILE_API,
  CHANGE_PASSWORD_API,
  DELETE_PROFILE_API,
} = settingsEndpoints

export function updateDisplayPicture(token, formData) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...")
    try {
        console.log("helooo1")
      const response = await apiConnector(
        "PUT",
        UPDATE_DISPLAY_PICTURE_API,
        formData,
        {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`,
        }
      )

      console.log(
        "UPDATE_DISPLAY_PICTURE_API API RESPONSE............",
        response
      )

      if (!response.data.success) {
        throw new Error(response.data.message)
      }
      toast.success("Display Picture Updated Successfully")
      dispatch(setUser(response.data.data))
      // const user=useSelector((state)=>state.auth);
      // user.additionalDetails=response.data.profileDetails;
      localStorage.setItem("user", JSON.stringify(response.data.data))
    } catch (error) {
      console.log("UPDATE_DISPLAY_PICTURE_API API ERROR............", error)
      toast.error("Could Not Update Display Picture")
    }
    toast.dismiss(toastId)
  }
}

export function updateProfile(token, formData) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...")
    try {
      const response = await apiConnector("PUT", UPDATE_PROFILE_API, formData, {
        "Authorization": `Bearer ${token}`,
      })
      console.log("UPDATE_PROFILE_API API RESPONSE............", response)

      if (!response.data.success) {
        throw new Error(response.data.message)
      }
      console.log("response",response.data)
      const userImage = response.data.userDetails.image
        ? response.data.userDetails.image
        : `https://api.dicebear.com/5.x/initials/svg?seed=${response.data.userDetails.firstName} ${response.data.userDetails.lastName}`

        response.data.userDetails.additionalDetails={...response.data.profileDetails}
      dispatch(
        setUser({ ...response.data.userDetails,image:userImage })
      )
      // const user=useSelector((state)=>state.auth);
      // user.additionalDetails=response.data.profileDetails;
      localStorage.setItem("user", JSON.stringify(response.data.userDetails))
      toast.success("Profile Updated Successfully")
    } catch (error) {
      console.log("UPDATE_PROFILE_API API ERROR............", error)
      toast.error("Could Not Update Profilee")
    }
    toast.dismiss(toastId)
  }
}

export async function changePassword(token, formData,navigate,dispatch) {

  console.log("change password started before return")
  // return async (dispatch) => {
  
    console.log("change password started after return")
    const toastId = toast.loading("Loading...");
  
    try {
      const response = await apiConnector("POST", CHANGE_PASSWORD_API, formData, {
        "Authorization": `Bearer ${token}`,
      })
      console.log("CHANGE_PASSWORD_API API RESPONSE............", response)
  
      if (!response.data.success) {
        throw new Error(response.data.message)
      }
      toast.success("Password Changed Successfully")
      dispatch(logout(navigate))
      toast.success("Login again")
    } catch (error) {
      console.log("CHANGE_PASSWORD_API API ERROR............", error)
      toast.error(error.response.data.message)
    }
    toast.dismiss(toastId);
  // }
}

export function deleteProfile(token, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...")
    try {
      const response = await apiConnector("DELETE", DELETE_PROFILE_API, null, {
        "Authorization": `Bearer ${token}`,
      })
      console.log("DELETE_PROFILE_API API RESPONSE............", response)

      if (!response.data.success) {
        throw new Error(response.data.message)
      }
      toast.success("Profile Deleted Successfully");
      dispatch(logout(navigate));
    } catch (error) {
      console.log("DELETE_PROFILE_API API ERROR............", error)
      toast.error("Could Not Delete Profile")
    }
    toast.dismiss(toastId)
  }
}