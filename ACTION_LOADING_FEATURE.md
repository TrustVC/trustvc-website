# Action URL Document Loading — Implementation Guide

This document explains the full mechanism behind loading a TradeTrust document from a URL query parameter (`?q=`). Use this to replicate the feature in any React + Redux (or Redux-like) codebase regardless of component names.

---

## What this feature does

When the app is visited with a URL like:

```
https://your-app.com/?q={"type":"DOCUMENT","payload":{"uri":"https://storage.example.com/doc.json","chainId":11155111}}
```

The app automatically:
1. Parses the `?q=` JSON from the URL
2. Switches the blockchain network to match `chainId`
3. Fetches the document JSON from `payload.uri`
4. Optionally decrypts it (if it's an OA encrypted document) using a key from the URL hash (`#`)
5. Loads the document into global state and verifies it

The QR code format (`https://actions.tradetrust.io?q=...`) encodes this same JSON, so scanning a QR code hits the same flow.

---

## URL format

```
https://your-app.com/?q=<URL-encoded JSON>
```

The decoded `q` value must be:

```json
{
  "type": "DOCUMENT",
  "payload": {
    "uri": "https://path/to/document.json",
    "chainId": 11155111,
    "key": "optional-decryption-key",
    "permittedActions": ["STORE"],
    "redirect": "https://your-app.com"
  }
}
```

For encrypted documents, the decryption key can also be passed in the URL hash instead of in `payload.key`:

```
/?q=<encoded-JSON>#<URL-encoded JSON anchor, e.g. {"key":"decryption-key-here"}>
```

The hash (`#`) key takes priority over `payload.key`.

---

## Architecture overview

```
URL (?q=...)
     │
     ▼
[Page/Container Component]  ←── reads location.search on mount
     │  parses ?q= JSON
     │  extracts type, payload, anchor(hash)
     │
     ├── if type !== "DOCUMENT"  → dispatch failure action
     ├── if chainId missing      → dispatch failure action
     └── else
          │  switchNetwork(chainId)
          ▼
     dispatch(retrieveDocumentByAction(payload, anchor))
          │
          ▼
[Async Handler / Saga / Thunk]
     │  fetch(payload.uri)
     │  optionally decrypt (if type === "OPEN-ATTESTATION-TYPE-1")
     │
     ▼
dispatch(updateDocument(fetchedDocument))
     │
     ▼
[Verification Handler]       ←── triggered by updateDocument
     │  verifies the document
     │
     ▼
navigate to /viewer (or equivalent)
```

---

## Step-by-step implementation

### Step 1 — Define action types

Add these to your document/certificate reducer:

```ts
const types = {
  UPDATE_DOCUMENT:                        "UPDATE_DOCUMENT",

  RETRIEVE_DOCUMENT_BY_ACTION:            "RETRIEVE_DOCUMENT_BY_ACTION",
  RETRIEVE_DOCUMENT_BY_ACTION_PENDING:    "RETRIEVE_DOCUMENT_BY_ACTION_PENDING",
  RETRIEVE_DOCUMENT_BY_ACTION_SUCCESS:    "RETRIEVE_DOCUMENT_BY_ACTION_SUCCESS",
  RETRIEVE_DOCUMENT_BY_ACTION_FAILURE:    "RETRIEVE_DOCUMENT_BY_ACTION_FAILURE",

  VERIFYING_DOCUMENT:                     "VERIFYING_DOCUMENT",
  VERIFYING_DOCUMENT_COMPLETED:           "VERIFYING_DOCUMENT_COMPLETED",
  VERIFYING_DOCUMENT_FAILURE:             "VERIFYING_DOCUMENT_FAILURE",
};
```

### Step 2 — Add state shape to your reducer

```ts
interface DocumentState {
  raw: any | null;
  rawModified: any | null;

  retrieveByActionState: "INITIAL" | "PENDING" | "SUCCESS" | "FAILURE";
  retrieveByActionError: string | null;

  verificationPending: boolean;
  verificationStatus: any | null;
  verificationError: any | null;
}

const initialState: DocumentState = {
  raw: null,
  rawModified: null,
  retrieveByActionState: "INITIAL",
  retrieveByActionError: null,
  verificationPending: false,
  verificationStatus: null,
  verificationError: null,
};
```

Add cases to your reducer's switch statement:

```ts
case types.RETRIEVE_DOCUMENT_BY_ACTION_PENDING:
  return { ...state, retrieveByActionState: "PENDING" };

case types.RETRIEVE_DOCUMENT_BY_ACTION_SUCCESS:
  return { ...state, retrieveByActionState: "SUCCESS" };

case types.RETRIEVE_DOCUMENT_BY_ACTION_FAILURE:
  return { ...state, retrieveByActionState: "FAILURE", retrieveByActionError: action.payload };
```

### Step 3 — Add action creators

```ts
export function retrieveDocumentByAction(payload: { uri: string; key?: string }, anchor: { key?: string }) {
  return { type: types.RETRIEVE_DOCUMENT_BY_ACTION, payload, anchor };
}

export function retrieveDocumentByActionFailure(message: string) {
  return { type: types.RETRIEVE_DOCUMENT_BY_ACTION_FAILURE, payload: message };
}

export function updateDocument(payload: any) {
  return { type: types.UPDATE_DOCUMENT, payload };
}
```

### Step 4 — Write the async fetch handler (Saga or Thunk)

This is the function that actually fetches the document from the URI.

#### If using Redux-Saga:

```ts
// sagas/document.ts
import { call, put, takeEvery } from "redux-saga/effects";
import { decryptString } from "@govtechsg/oa-encryption"; // only needed for OA encrypted docs

export function* retrieveDocumentByActionSaga({ payload, anchor }: any): any {
  try {
    yield put({ type: "RETRIEVE_DOCUMENT_BY_ACTION_PENDING" });

    const { uri, key: payloadKey } = payload;
    const key = anchor?.key || payloadKey; // hash anchor key takes priority

    let document = yield window.fetch(uri).then((res) => {
      if (res.status >= 400) throw new Error(`Failed to load document from ${uri}`);
      return res.json();
    });

    // opencerts-function wraps the doc in { document: ... }
    document = document.document || document;

    if (!document) throw new Error(`Document at ${uri} is empty`);

    // Decrypt if it's an OA encrypted document
    if (document.type === "OPEN-ATTESTATION-TYPE-1") {
      if (!key) throw new Error("Document is encrypted but no decryption key was provided");
      const decrypted = decryptString({
        tag: document.tag,
        cipherText: document.cipherText,
        iv: document.iv,
        key,
        type: document.type,
      });
      document = JSON.parse(decrypted);
    }

    yield put({ type: "UPDATE_DOCUMENT", payload: document });
    yield put({ type: "RETRIEVE_DOCUMENT_BY_ACTION_SUCCESS" });
  } catch (e: any) {
    yield put({ type: "RETRIEVE_DOCUMENT_BY_ACTION_FAILURE", payload: e.message });
  }
}

// Register the saga watcher
export default [
  takeEvery("RETRIEVE_DOCUMENT_BY_ACTION", retrieveDocumentByActionSaga),
  takeEvery("UPDATE_DOCUMENT", verifyDocumentSaga), // trigger verification after load
];
```

#### If using Redux Thunk instead of Saga:

```ts
export const retrieveDocumentByActionThunk =
  (payload: { uri: string; key?: string }, anchor: { key?: string }) =>
  async (dispatch: any) => {
    try {
      dispatch({ type: "RETRIEVE_DOCUMENT_BY_ACTION_PENDING" });

      const { uri, key: payloadKey } = payload;
      const key = anchor?.key || payloadKey;

      const res = await window.fetch(uri);
      if (res.status >= 400) throw new Error(`Failed to load document from ${uri}`);
      let document = await res.json();
      document = document.document || document;

      if (!document) throw new Error(`Document at ${uri} is empty`);

      if (document.type === "OPEN-ATTESTATION-TYPE-1") {
        if (!key) throw new Error("Document is encrypted but no decryption key was provided");
        const decrypted = decryptString({ tag: document.tag, cipherText: document.cipherText, iv: document.iv, key, type: document.type });
        document = JSON.parse(decrypted);
      }

      dispatch({ type: "UPDATE_DOCUMENT", payload: document });
      dispatch({ type: "RETRIEVE_DOCUMENT_BY_ACTION_SUCCESS" });
      // then trigger your verification flow here
    } catch (e: any) {
      dispatch({ type: "RETRIEVE_DOCUMENT_BY_ACTION_FAILURE", payload: e.message });
    }
  };
```

### Step 5 — Create the URL-reading component

This component lives on your home/landing route. It reads `?q=` from the URL on mount and kicks off the flow. It renders nothing visible.

```tsx
// components/ActionLoader.tsx  (name it whatever fits your structure)
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";

// import your own versions of these:
// - retrieveDocumentByAction: action creator from Step 3
// - retrieveDocumentByActionFailure: action creator from Step 3
// - switchNetwork: your hook/function to change the chain

export const ActionLoader = () => {
  const location = useLocation();
  const history = useHistory();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("q");

    if (!query) return; // nothing to do if no ?q= param

    try {
      const action = JSON.parse(query);
      const { type, payload } = action;
      const { chainId } = payload;

      // Decode the optional decryption key from the URL hash
      const anchorStr = decodeURIComponent(location.hash.substring(1));
      const anchor = anchorStr ? JSON.parse(anchorStr) : {};

      if (type !== "DOCUMENT") {
        dispatch(retrieveDocumentByActionFailure(`Unsupported action type: ${type}`));
        return;
      }

      if (chainId === undefined) {
        dispatch(retrieveDocumentByActionFailure("No chainId in action payload — cannot select network"));
        return;
      }

      // Switch network then dispatch fetch
      switchNetwork(chainId).then(() => {
        dispatch(retrieveDocumentByAction(payload, anchor));
      });

    } catch {
      dispatch(retrieveDocumentByActionFailure("Invalid action URL — could not parse ?q= parameter"));
    }

    // Clean URL after processing so refresh doesn't re-trigger
    history.push("/");
  }, []); // run only once on mount

  return null; // renders nothing
};
```

**Where to mount this component:** Place it inside your app's layout/router so it is rendered on the root `/` path. It just needs to be present when the URL is loaded.

```tsx
// Example: inside your router / page layout
<Route path="/" component={HomePage} />

// Inside HomePage (or always-mounted layout):
<ActionLoader />
```

### Step 6 — Handle verification after document loads

When `UPDATE_DOCUMENT` is dispatched, trigger your existing document verification flow. With Redux-Saga:

```ts
takeEvery("UPDATE_DOCUMENT", verifyDocumentSaga)
```

After successful verification, navigate to your viewer route:

```ts
// inside verifyDocumentSaga, after verification passes:
yield history.push("/viewer"); // or whatever your viewer route is
```

### Step 7 — Show loading/error state (optional but recommended)

In whichever component shows the document area, read the action state from Redux:

```tsx
const retrieveState = useSelector((state) => state.document.retrieveByActionState);
const retrieveError = useSelector((state) => state.document.retrieveByActionError);

if (retrieveState === "PENDING") return <LoadingSpinner />;
if (retrieveState === "FAILURE") return <ErrorBanner message={retrieveError} />;
```

---

## The QR code format (for generating scannable codes)

The QR code encodes the same `?q=` payload. Use this utility to generate/parse QR strings:

```ts
// utils/actionUrl.ts

interface ActionPayload {
  uri: string;
  key?: string;
  chainId: number;
  permittedActions?: string[];
  redirect?: string;
}

// Generate a URL (for QR code or sharing)
export const encodeActionUrl = (baseUrl: string, payload: ActionPayload): string => {
  const action = { type: "DOCUMENT", payload };
  return `${baseUrl}?q=${encodeURIComponent(JSON.stringify(action))}`;
};

// Decode ?q= from a scanned QR code URL
export const decodeActionUrl = (url: string): { type: string; payload: ActionPayload } => {
  const parsed = new URL(url);
  const q = parsed.searchParams.get("q");
  if (!q) throw new Error("No ?q= parameter found in URL");
  return JSON.parse(decodeURIComponent(q));
};
```

---

## PostMessage support (for embedded/iframe use)

The reference implementation also supports loading a document from a `window.postMessage` event (used when the app is embedded in another page). Add this listener alongside the `ActionLoader`:

```ts
window.addEventListener("message", (event) => {
  // Allowlist origins you trust
  const allowedOrigins = ["https://your-trusted-domain.com", "http://localhost:3000"];
  if (!allowedOrigins.includes(event.origin)) return;

  if (event.data.type === "LOAD_DOCUMENT") {
    try {
      const doc = JSON.parse(atob(event.data.payload)); // base64-encoded JSON
      dispatch(updateDocument(doc));
    } catch (e) {
      console.error("Failed to decode postMessage document", e);
    }
  }
});
```

---

## Dependency checklist

| Need | Package |
|------|---------|
| Encrypted OA document support | `@govtechsg/oa-encryption` |
| Document verification | `@trustvc/trustvc` (or your verification lib) |
| Routing (`useLocation`, `useHistory`) | `react-router-dom` v5 (or v6 equivalents) |
| State management | `redux` + `react-redux` + `redux-saga` or `redux-thunk` |

If you are on **react-router-dom v6**, replace `useHistory` with `useNavigate`:
```ts
const navigate = useNavigate();
navigate("/");        // instead of history.push("/")
navigate("/viewer");  // instead of history.push("/viewer")
```

---

## Quick sanity-check test

After implementing, test with this URL (replace with your local port and a real hosted `.json` file):

```
http://localhost:3000/?q={"type":"DOCUMENT","payload":{"uri":"https://raw.githubusercontent.com/TradeTrust/tradetrust-website/master/src/test/fixture/sample-dns-verified.tt","chainId":11155111}}
```

Expected behaviour:
1. App loads, network switches to Sepolia (chainId 11155111)
2. Document fetches from the URI
3. App verifies and redirects to `/viewer` showing the document
