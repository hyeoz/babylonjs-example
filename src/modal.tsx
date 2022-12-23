import React from "react";

export default function Modal() {
  const onClickExit = () => {};
  return (
    <div id="modal-content">
      <span id="modal-exit">X</span>
      <iframe
        width={1280}
        height={960}
        src="https://naver.com"
        id="modal-iframe"
      />
    </div>
  );
}
